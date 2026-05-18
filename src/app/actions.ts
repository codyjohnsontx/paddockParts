"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const partSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  brand: z.string().optional(),
  side: z.string().default("universal"),
  tags: z.string().optional(),
});

export async function addSparePart(formData: FormData) {
  const parsed = partSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Add a part name and category." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase env vars are not set. The local demo UI remains available.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sign in before adding inventory." };
  }

  const { error } = await supabase.from("spare_parts").insert({
    user_id: user.id,
    name: parsed.data.name,
    category: parsed.data.category,
    brand: parsed.data.brand ?? "",
    side: parsed.data.side,
    compatibility_tags: parsed.data.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  return { ok: true, message: "Spare added." };
}
