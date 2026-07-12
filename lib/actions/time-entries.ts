"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionResult } from "./result";

async function requireUser() {
  const [supabase, user] = await Promise.all([
    createClient(),
    getCurrentUser(),
  ]);
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

async function syncTags(
  supabase: SupabaseClient,
  userId: string,
  entryId: string,
  tagIds: string[]
) {
  await supabase.from("time_entry_tags").delete().eq("time_entry_id", entryId);
  const clean = Array.from(new Set(tagIds)).filter(Boolean);
  if (clean.length > 0) {
    await supabase.from("time_entry_tags").insert(
      clean.map((tag_id) => ({
        time_entry_id: entryId,
        tag_id,
        user_id: userId,
      }))
    );
  }
}

async function stopRunning(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("time_entries")
    .update({ end_time: new Date().toISOString() })
    .eq("user_id", userId)
    .is("end_time", null);
}

export type EntryInput = {
  description: string;
  project_id: string | null;
  billable: boolean;
  tag_ids: string[];
  start_time?: string;
  end_time?: string | null;
};

export async function startTimer(input: EntryInput): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  // Garante um único timer rodando.
  await stopRunning(supabase, user.id);

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: user.id,
      description: input.description ?? "",
      project_id: input.project_id,
      billable: input.billable,
      start_time: input.start_time ?? new Date().toISOString(),
      end_time: null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível iniciar o timer." };

  // Entrada recém-criada não tem tags a remover: insere direto e evita
  // um DELETE inútil (um round trip a menos ao banco).
  const tagIds = Array.from(new Set(input.tag_ids ?? [])).filter(Boolean);
  if (tagIds.length > 0) {
    await supabase.from("time_entry_tags").insert(
      tagIds.map((tag_id) => ({
        time_entry_id: data.id,
        tag_id,
        user_id: user.id,
      }))
    );
  }

  revalidatePath("/tracker");
  return { ok: true, id: data.id };
}

export async function stopTimer(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("time_entries")
    .update({ end_time: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Não foi possível parar o timer." };

  revalidatePath("/tracker");
  return { ok: true };
}

export async function createManualEntry(
  input: EntryInput
): Promise<ActionResult> {
  if (!input.start_time || !input.end_time) {
    return { error: "Início e fim são obrigatórios." };
  }
  if (new Date(input.end_time) <= new Date(input.start_time)) {
    return { error: "O horário de fim deve ser depois do início." };
  }

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: user.id,
      description: input.description ?? "",
      project_id: input.project_id,
      billable: input.billable,
      start_time: input.start_time,
      end_time: input.end_time,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar a entrada." };

  await syncTags(supabase, user.id, data.id, input.tag_ids ?? []);

  revalidatePath("/tracker");
  return { ok: true };
}

export async function updateEntry(
  id: string,
  input: EntryInput
): Promise<ActionResult> {
  if (input.start_time && input.end_time) {
    if (new Date(input.end_time) <= new Date(input.start_time)) {
      return { error: "O horário de fim deve ser depois do início." };
    }
  }

  const { supabase, user } = await requireUser();
  const update: Record<string, unknown> = {
    description: input.description ?? "",
    project_id: input.project_id,
    billable: input.billable,
  };
  if (input.start_time) update.start_time = input.start_time;
  if (input.end_time !== undefined) update.end_time = input.end_time;

  const { error } = await supabase
    .from("time_entries")
    .update(update)
    .eq("id", id);
  if (error) return { error: "Não foi possível atualizar a entrada." };

  await syncTags(supabase, user.id, id, input.tag_ids ?? []);

  revalidatePath("/tracker");
  return { ok: true };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a entrada." };

  revalidatePath("/tracker");
  return { ok: true };
}

async function loadEntryWithTags(
  supabase: SupabaseClient,
  id: string
): Promise<EntryInput | null> {
  const { data } = await supabase
    .from("time_entries")
    .select("description, project_id, billable, start_time, end_time")
    .eq("id", id)
    .single();
  if (!data) return null;
  const { data: tagRows } = await supabase
    .from("time_entry_tags")
    .select("tag_id")
    .eq("time_entry_id", id);
  return {
    description: data.description,
    project_id: data.project_id,
    billable: data.billable,
    start_time: data.start_time,
    end_time: data.end_time,
    tag_ids: (tagRows ?? []).map((r) => r.tag_id as string),
  };
}

export async function duplicateEntry(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const src = await loadEntryWithTags(supabase, id);
  if (!src) return { error: "Entrada não encontrada." };

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: user.id,
      description: src.description,
      project_id: src.project_id,
      billable: src.billable,
      start_time: src.start_time,
      end_time: src.end_time,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Não foi possível duplicar." };

  await syncTags(supabase, user.id, data.id, src.tag_ids);

  revalidatePath("/tracker");
  return { ok: true };
}

/** Inicia um novo timer com os mesmos dados de uma entrada existente. */
export async function continueEntry(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const src = await loadEntryWithTags(supabase, id);
  if (!src) return { error: "Entrada não encontrada." };

  return startTimer({
    description: src.description,
    project_id: src.project_id,
    billable: src.billable,
    tag_ids: src.tag_ids,
  });
}
