import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export type Address = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export const formatAddress = (a: Address) =>
  [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(", ");

export function useAddresses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["addresses", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Address[];
    },
  });
}

const empty = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  is_default: false,
};

export function AddressBook({
  selectedId,
  onSelect,
  manageMode = false,
}: {
  selectedId?: string | null;
  onSelect?: (address: Address) => void;
  manageMode?: boolean;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: addresses, isLoading } = useAddresses();
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!onSelect || !addresses?.length || selectedId) return;
    const preferred = addresses.find((a) => a.is_default) ?? addresses[0];
    if (preferred) onSelect(preferred);
  }, [addresses, selectedId, onSelect]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in first");
      if (!form.full_name.trim() || !form.phone.trim() || !form.line1.trim()) {
        throw new Error("Name, phone and street address are required");
      }
      if (!/^\d{6}$/.test(form.pincode.trim())) throw new Error("Enter a valid 6-digit pincode");

      if (form.is_default) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
      }
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          label: form.label.trim() || "Home",
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          line1: form.line1.trim(),
          line2: form.line2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          is_default: form.is_default || !(addresses?.length ?? 0),
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Address;
    },
    onSuccess: (address) => {
      toast.success("Address saved");
      setForm(empty);
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["addresses"] });
      onSelect?.(address);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save address"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Address removed");
      void qc.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const makeDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["addresses"] }),
  });

  const field = (
    key: keyof typeof empty,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label htmlFor={`addr-${key}`} className="eyebrow block">
        {label}
      </label>
      <input
        id={`addr-${key}`}
        value={String(form[key] ?? "")}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
        {...props}
      />
    </div>
  );

  return (
    <div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading addresses…</p>}

      <ul className="space-y-3">
        {(addresses ?? []).map((a) => (
          <li key={a.id}>
            <div
              className={cn(
                "flex items-start justify-between gap-4 border p-4 text-sm",
                selectedId === a.id ? "border-gold bg-secondary/50" : "border-border",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect?.(a)}
                className="flex-1 text-left"
                disabled={!onSelect}
              >
                <p className="text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
                  {a.label} {a.is_default && "· Default"}
                </p>
                <p className="mt-1">{a.full_name}</p>
                <p className="text-muted-foreground">{a.phone}</p>
                <p className="mt-1 text-muted-foreground">{formatAddress(a)}</p>
              </button>
              {manageMode && (
                <div className="flex shrink-0 flex-col gap-2 text-[0.62rem] uppercase tracking-[0.14em]">
                  {!a.is_default && (
                    <button
                      type="button"
                      onClick={() => makeDefault.mutate(a.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove.mutate(a.id)}
                    className="text-destructive"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {open ? (
        <div className="mt-5 space-y-4 border border-border p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("label", "Label")}
            {field("full_name", "Full name", { autoComplete: "name" })}
            {field("phone", "Phone", { autoComplete: "tel", inputMode: "tel" })}
            {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6 })}
          </div>
          {field("line1", "Address line 1")}
          {field("line2", "Address line 2 (optional)")}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("city", "City")}
            {field("state", "State")}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
            />
            Make this my default address
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate()}
              className="bg-gold px-6 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-gold-foreground disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border border-border px-6 py-3 text-[0.7rem] uppercase tracking-[0.18em]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 border border-foreground px-6 py-3 text-[0.7rem] uppercase tracking-[0.18em] transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          + Add new address
        </button>
      )}
    </div>
  );
}
