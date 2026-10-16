"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCustomer, safeNext } from "@/lib/customer-auth";

export interface AuthFormState {
  error?: string;
  notice?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "phone" | "password" | "confirm", string>>;
  values?: { name?: string; email?: string; phone?: string };
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;

// Links in emails must come back to this site. Supabase also only accepts addresses listed under
// Authentication → URL Configuration, so a faked Host header can't send people elsewhere.
async function siteOrigin() {
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
  const next = safeNext(formData.get("next"));
  const values = { name, email, phone };

  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Please enter your full name.";
  if (!validEmail(email)) fieldErrors.email = "Please enter a valid email address.";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) fieldErrors.phone = "Please enter a valid phone number.";
  if (password.length < 8 || password.length > 72) fieldErrors.password = "Use 8 to 72 characters.";
  if (password !== confirm) fieldErrors.confirm = "The two passwords do not match.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, phone },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const weak = /password/i.test(error.message);
    return { error: weak ? "Please choose a stronger password." : "We could not create the account. Please try again.", values };
  }
  // Signed in straight away when email confirmation is switched off in Supabase
  if (data.session) redirect(next);
  // Supabase answers the same way for an email that is already registered, so this message
  // doesn't reveal which emails have accounts
  return {
    notice: `Almost done. We sent a link to ${email}. Open it to confirm your email, then you're signed in.`,
    values,
  };
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
        ? "Please confirm your email first: open the link we sent you."
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
  const supabase = await createSupabaseServer();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent("/account/password")}`,
  });
  // Same answer whether or not the email has an account
  return { notice: `If ${email} has an account, a link to set a new password is on its way.`, values: { email } };
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
