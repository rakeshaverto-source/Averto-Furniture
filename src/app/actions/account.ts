"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { codeEmail, existingAccountEmail, sendMail } from "@/lib/mailer";
import { mayResend } from "@/lib/otp-throttle";
import { getCustomer, safeNext } from "@/lib/customer-auth";

export interface AuthFormState {
  error?: string;
  notice?: string;
  step?: "verify"; // a code has been emailed; the form now asks for it
  fieldErrors?: Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "code", string>>;
  values?: { name?: string; email?: string; phone?: string };
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;

// The shop's own address, for links in emails. NEXT_PUBLIC_SITE_URL wins so a faked Host header
// can't put another site's address in our emails.
async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signUpCustomer(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = text(formData, "name").slice(0, 80);
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone").slice(0, 20);
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const values = { name, email, phone };

  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Please enter your full name.";
  if (!validEmail(email)) fieldErrors.email = "Please enter a valid email address.";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) fieldErrors.phone = "Please enter a valid phone number.";
  if (password.length < 8 || password.length > 72) fieldErrors.password = "Use 8 to 72 characters.";
  if (password !== confirm) fieldErrors.confirm = "The two passwords do not match.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  if (!mayResend(`signup:${email}`)) {
    return { step: "verify", error: "Please wait a minute before asking for another code.", values };
  }

  // Supabase makes the account and its one-time code without sending any email; we send the code
  // ourselves from the shop's Gmail. Nothing is signed in until the code is entered.
  const admin = supabaseAdmin().auth.admin;
  const taken = (code?: string) => code === "email_exists" || code === "user_already_exists";
  // A signup code for a new or never-confirmed email; a sign-in code when Supabase says it is taken
  const newCode = async () => {
    const signup = await admin.generateLink({ type: "signup", email, password, options: { data: { full_name: name, phone } } });
    return taken(signup.error?.code) ? admin.generateLink({ type: "magiclink", email }) : signup;
  };

  let { data, error } = await newCode();
  if (error || !data.properties?.email_otp) {
    const weak = error?.code === "weak_password" || /password/i.test(error?.message ?? "");
    return { error: weak ? "Please choose a stronger password." : "We could not create the account. Please try again.", values };
  }
  try {
    if (data.user.email_confirmed_at) {
      // A real account already: same screen as a new signup, so the form doesn't reveal which
      // emails have accounts, and the owner gets a note instead of a code
      await sendMail({ to: email, ...existingAccountEmail(await siteOrigin()) });
    } else {
      // Registered before but never confirmed: keep the details from this latest attempt. Saving a
      // password cancels any code already issued, so the code that is emailed is made after it.
      if (Date.now() - new Date(data.user.created_at).getTime() > 60_000) {
        await admin.updateUserById(data.user.id, { password, user_metadata: { full_name: name, phone } });
        ({ data, error } = await newCode());
        if (error || !data.properties?.email_otp) throw error ?? new Error("No code after updating the account");
      }
      await sendMail({ to: email, ...codeEmail("signup", data.properties.email_otp) });
    }
  } catch (e) {
    console.error(e);
    return { error: "We couldn't send the email just now. Please try again in a few minutes.", values };
  }
  return { step: "verify", notice: `We emailed a code to ${email}. Enter it below to finish.`, values };
}

// Second step of signing up: the emailed code confirms the email and signs the customer in
export async function verifySignupCode(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email").toLowerCase();
  const token = text(formData, "code").replace(/\s/g, "");
  const next = safeNext(formData.get("next"));
  if (!/^\d{6,10}$/.test(token)) return { step: "verify", fieldErrors: { code: "Enter the code from the email." }, values: { email } };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return {
      step: "verify",
      fieldErrors: { code: "That code is wrong or has expired. Check the latest email, or send a new code." },
      values: { email },
    };
  }
  redirect(next);
}

export async function signInCustomer(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) return { error: "Enter your email and password.", values: { email } };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const unconfirmed = /confirm/i.test(error.message);
    return {
      error: unconfirmed
        ? "Please confirm your email first. Create the account again with the same email to get a new code."
        : "That email and password don't match.",
      values: { email },
    };
  }
  redirect(next);
}

export async function signOutCustomer() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email").toLowerCase();
  if (!validEmail(email)) return { error: "Please enter a valid email address.", values: { email } };
  const sent = { step: "verify" as const, notice: `If ${email} has an account, we emailed it a code.`, values: { email } };
  if (!mayResend(`reset:${email}`)) return { ...sent, notice: undefined, error: "Please wait a minute before asking for another code." };

  const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type: "recovery", email });
  // No account: show the same screen, so the form doesn't reveal which emails have accounts
  if (error || !data.properties?.email_otp) return sent;
  try {
    await sendMail({ to: email, ...codeEmail("reset", data.properties.email_otp) });
  } catch (e) {
    console.error(e);
    return { error: "We couldn't send the email just now. Please try again in a few minutes.", values: { email } };
  }
  return sent;
}

// Second step of "forgot password": the emailed code signs the customer in, then the new password is saved
export async function resetPasswordWithCode(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email").toLowerCase();
  const token = text(formData, "code").replace(/\s/g, "");
  const password = String(formData.get("password") ?? "");
  const values = { email };
  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (!/^\d{6,10}$/.test(token)) fieldErrors.code = "Enter the code from the email.";
  if (password.length < 8 || password.length > 72) fieldErrors.password = "Use 8 to 72 characters.";
  if (password !== String(formData.get("confirm") ?? "")) fieldErrors.confirm = "The two passwords do not match.";
  if (Object.keys(fieldErrors).length) return { step: "verify", fieldErrors, values };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
  if (error) {
    return {
      step: "verify",
      fieldErrors: { code: "That code is wrong or has expired. Check the latest email, or send a new code." },
      values,
    };
  }
  const { error: saveError } = await supabase.auth.updateUser({ password });
  if (saveError) return { step: "verify", error: "Please choose a different, stronger password.", values };
  redirect("/account?password=1");
}

export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!(await getCustomer())) return { error: "The link has expired. Please ask for a new one." };
  const password = String(formData.get("password") ?? "");
  if (password.length < 8 || password.length > 72) return { fieldErrors: { password: "Use 8 to 72 characters." } };
  if (password !== String(formData.get("confirm") ?? "")) return { fieldErrors: { confirm: "The two passwords do not match." } };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Please choose a different, stronger password." };
  redirect("/account?password=1");
}
