"use server";

import { getProduct } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export interface ReviewFormValues {
  rating: string;
  title: string;
  text: string;
  name: string;
  location: string;
  email: string;
}

export interface ReviewFormState {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof ReviewFormValues, string>>;
  values?: ReviewFormValues;
}

// Submitted reviews are saved as "pending". Nothing is published automatically: the team sets a
// review to "approved" in the reviews table, and only then does it show on the product page.

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function submitReview(
  _previous: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  // Hidden "website" field: real visitors leave it empty, bots tend to fill it in
  if (field(formData, "website")) return { status: "success" };

  const values: ReviewFormValues = {
    rating: field(formData, "rating"),
    title: field(formData, "title"),
    text: field(formData, "text"),
    name: field(formData, "name"),
    location: field(formData, "location"),
    email: field(formData, "email"),
  };

  // This function can be called directly with a POST, so everything is checked again here
  const productId = field(formData, "productId");
  if (!(await getProduct(productId))) {
    return { status: "error", message: "We could not find that product.", values };
  }

  const errors: NonNullable<ReviewFormState["errors"]> = {};
  const rating = Number(values.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Please choose a star rating.";
  if (values.title.length < 3 || values.title.length > 80) errors.title = "Add a short title (3 to 80 characters).";
  if (values.text.length < 20 || values.text.length > 1000) {
    errors.text = "Please write between 20 and 1000 characters.";
  }
  if (values.name.length < 2 || values.name.length > 60) errors.name = "Please tell us your name.";
  if (values.location.length > 60) errors.location = "Please keep this under 60 characters.";
  if (values.email && (values.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))) {
    errors.email = "That email address does not look right.";
  }
  if (Object.keys(errors).length > 0) return { status: "error", errors, values };

  try {
    await prisma.review.create({
      data: {
        productId,
        rating,
        title: values.title,
        text: values.text,
        name: values.name,
        location: values.location,
        email: values.email || null, // kept for follow-up only, never shown on the site
        status: "pending",
      },
    });
  } catch {
    return {
      status: "error",
      message: "We could not save your review right now. Please email it to concierge@averto.in instead.",
      values,
    };
  }

  return { status: "success" };
}
