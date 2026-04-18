import { createClient } from "@supabase/supabase-js";

export const SUPA_URL = "https://grdngybbonzbhtojixdv.supabase.co";
export const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZG5neWJib256Ymh0b2ppeGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTQ2NDEsImV4cCI6MjA5MjAzMDY0MX0.ORh7PYI5Hk8U8J_WwHF_JWQYPwY5nU4ah5Xv-Zkc8WU";
export const sb = createClient(SUPA_URL, SUPA_KEY);

// ── Farm config ───────────────────────────────────────────────────────────
export async function sbLoadFarm() {
  try {
    const { data, error } = await sb.from("farm_config").select("*").eq("id", "main").single();
    if (error || !data) return null;
    return data.config ?? null;
  } catch { return null; }
}
export async function sbSaveFarm(farm) {
  try {
    await sb.from("farm_config").upsert({ id: "main", config: farm, updated_at: new Date().toISOString() });
  } catch {}
}

// ── Field logs ────────────────────────────────────────────────────────────
export async function sbLoadLogs() {
  try {
    const { data } = await sb.from("field_logs").select("*").order("created_at", { ascending: false }).limit(200);
    return data?.map(r => ({ ...r.data, id: r.id, _sbid: r.id, user_name: r.user_name })) || [];
  } catch { return []; }
}
export async function sbInsertLog(log, userName) {
  try {
    const { data, error } = await sb.from("field_logs")
      .insert({ data: { ...log }, user_name: userName || "", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return { ...log, id: data.id, _sbid: data.id };
  } catch { return log; }
}

// ── Farm data ─────────────────────────────────────────────────────────────
export async function sbLoadData() {
  try {
    const { data } = await sb.from("farm_data").select("*").order("created_at", { ascending: false }).limit(300);
    return data?.map(r => ({ ...r.data, id: r.id, _sbid: r.id, user_name: r.user_name })) || [];
  } catch { return []; }
}
export async function sbInsertData(entry, userName) {
  try {
    const { data, error } = await sb.from("farm_data")
      .insert({ data: { ...entry }, user_name: userName || "", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return { ...entry, id: data.id, _sbid: data.id };
  } catch { return entry; }
}

// ── Photos ────────────────────────────────────────────────────────────────
export async function sbLoadPhotos() {
  try {
    const { data } = await sb.from("photos").select("*").order("created_at", { ascending: false }).limit(200);
    return data?.map(r => ({ ...r.data, id: r.id, _sbid: r.id, url: r.url, user_name: r.user_name })) || [];
  } catch { return []; }
}
export async function sbInsertPhoto(photo, userName, imageFile) {
  let url = null;
  if (imageFile) {
    try {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await sb.storage.from("photos").upload(path, imageFile, { contentType: imageFile.type });
      if (!upErr) {
        const { data: urlData } = sb.storage.from("photos").getPublicUrl(path);
        url = urlData.publicUrl;
      }
    } catch {}
  }
  try {
    const { data, error } = await sb.from("photos")
      .insert({ data: { ...photo }, url, user_name: userName || "", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return { ...photo, id: data.id, _sbid: data.id, url };
  } catch { return { ...photo, url }; }
}

// ── Activity status ───────────────────────────────────────────────────────
export async function sbLoadActStatus() {
  try {
    const { data } = await sb.from("activity_status").select("*");
    const map = {};
    data?.forEach(r => {
      map[r.act_id] = { status: r.status, scheduledDate: r.scheduled_date || "", assignee: r.assignee || "", notes: r.notes || "" };
    });
    return map;
  } catch { return {}; }
}
export async function sbSaveActStatus(actId, fields, userName) {
  try {
    await sb.from("activity_status").upsert({
      act_id: actId,
      status: fields.status,
      scheduled_date: fields.scheduledDate || null,
      assignee: fields.assignee || null,
      notes: fields.notes || null,
      updated_by: userName || null,
      updated_at: new Date().toISOString(),
    });
  } catch {}
}
