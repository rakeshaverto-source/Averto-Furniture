"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { saveAddress, type FormResult } from "@/app/actions/account-data";
import { lookupPincode, type PincodeArea } from "@/app/actions/pincode";

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

export interface AddressValues {
  id?: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  locality?: string;
  landmark?: string;
  city: string;
  tehsil?: string;
  state: string;
  pincode: string;
}

const QUICK_LABELS = ["Home", "Work"];
const OTHER_AREA = "__other";

// Used on the account page and inside checkout. onSaved gets the address as saved (with its id),
// so checkout can select it without reloading the page.
export default function AddressForm({
  address,
  onSaved,
  onCancel,
  submitLabel,
}: {
  address?: AddressValues;
  onSaved?: (saved: AddressValues & { id: string }) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialLabel = address?.label ?? "";
  const [label, setLabel] = useState(initialLabel);
  const [otherLabel, setOtherLabel] = useState(initialLabel !== "" && !QUICK_LABELS.includes(initialLabel));
  const [pinHint, setPinHint] = useState<{ kind: "loading" | "found" | "missing"; text: string } | null>(null);
  // The areas (post offices) of the pincode; the customer picks theirs, or types it in
  const [areas, setAreas] = useState<PincodeArea[]>([]);
  const [locality, setLocality] = useState(address?.locality ?? "");
  const [typedLocality, setTypedLocality] = useState(false);
  const [tehsil, setTehsil] = useState(address?.tehsil ?? "");
  const latestPin = useRef("");
  const autoFilled = useRef<{ city: string; state: string } | null>(null);

  // Typing a full pincode fills in the city and state and lists its areas (all still editable)
  const onPincode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    e.target.value = pin;
    latestPin.current = pin;
    if (pin.length < 6) {
      setPinHint(null);
      setAreas([]);
      return;
    }
    setPinHint({ kind: "loading", text: "Looking up your pincode…" });
    const previousAuto = autoFilled.current;
    const result = await lookupPincode(pin);
    if (latestPin.current !== pin) return; // a newer pincode was typed meanwhile
    const city = formRef.current?.elements.namedItem("city") as HTMLInputElement | null;
    const stateInput = formRef.current?.elements.namedItem("state") as HTMLInputElement | null;
    if (!city || !stateInput) return;
    if (result.ok) {
      autoFilled.current = { city: result.city, state: result.state };
      city.value = result.city;
      stateInput.value = result.state;
      setAreas(result.areas);
      // keep the area if it belongs to this pincode too; a pincode with one area picks it
      const match = result.areas.find((a) => a.name.toLowerCase() === locality.trim().toLowerCase());
      const picked = match ?? (result.areas.length === 1 ? result.areas[0] : undefined);
      setLocality(picked?.name ?? "");
      setTehsil(picked?.tehsil ?? "");
      setTypedLocality(false);
      setPinHint({ kind: "found", text: `District ${result.city}, ${result.state}` });
    } else {
      // Drop what an earlier pincode filled in (but never anything the customer typed themselves)
      if (previousAuto && city.value === previousAuto.city) city.value = "";
      if (previousAuto && stateInput.value === previousAuto.state) stateInput.value = "";
      autoFilled.current = null;
      setAreas([]);
      setTehsil("");
      setPinHint({ kind: "missing", text: result.error });
    }
  };

  const [state, action, pending] = useActionState<FormResult, FormData>(async (prev, formData) => {
    const result = await saveAddress(prev, formData);
    if (result.ok && result.id) {
      const value = (k: keyof AddressValues) => String(formData.get(k) ?? "").trim();
      onSaved?.({
        id: result.id,
        label: value("label"),
        name: value("name"),
        phone: value("phone"),
        address: value("address"),
        locality: value("locality"),
        landmark: value("landmark"),
        city: value("city"),
        tehsil: value("tehsil"),
        state: value("state"),
        pincode: value("pincode"),
      });
      if (!address?.id) {
        // a new address was added: ready for the next one
        formRef.current?.reset();
        setLabel("");
        setOtherLabel(false);
        setPinHint(null);
        setAreas([]);
        setLocality("");
        setTypedLocality(false);
        setTehsil("");
        autoFilled.current = null;
      }
    }
    return result;
  }, {});
  const errors = state.fieldErrors ?? {};

  const field = (name: keyof AddressValues, text: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm font-medium text-stone-900">
      {text}
      <input name={name} defaultValue={address?.[name] ?? ""} className={`${inputClass} mt-1.5`} aria-invalid={!!errors[name]} {...props} />
      {errors[name] && <span className="mt-1 block text-xs font-normal text-red-700">{errors[name]}</span>}
    </label>
  );

  const chip = (text: string, active: boolean, onClick: () => void) => (
    <button
      key={text}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
        active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-600"
      }`}
    >
      {text}
    </button>
  );

  const pickArea = areas.length > 0 && !typedLocality;

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="grid sm:grid-cols-2 gap-4"
    >
      {address?.id && <input type="hidden" name="id" value={address.id} />}
      <input type="hidden" name="tehsil" value={tehsil} />
      {field("name", "Full name", { autoComplete: "name", maxLength: 80 })}
      {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 20 })}

      <label className="block text-sm font-medium text-stone-900">
        Pincode
        <input
          name="pincode"
          defaultValue={address?.pincode ?? ""}
          onChange={onPincode}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          className={`${inputClass} mt-1.5`}
          aria-invalid={!!errors.pincode}
        />
        {errors.pincode && <span className="mt-1 block text-xs font-normal text-red-700">{errors.pincode}</span>}
        {pinHint && !errors.pincode && (
          <span
            role="status"
            className={`mt-1 block text-xs font-normal ${pinHint.kind === "found" ? "text-emerald-800" : pinHint.kind === "missing" ? "text-amber-800" : "text-stone-500"}`}
          >
            {pinHint.text}
          </span>
        )}
      </label>

      <label className="block text-sm font-medium text-stone-900">
        Locality / area
        {pickArea ? (
          <select
            name="locality"
            value={locality}
            onChange={(e) => {
              if (e.target.value === OTHER_AREA) {
                setTypedLocality(true);
                setLocality("");
                setTehsil("");
                return;
              }
              setLocality(e.target.value);
              setTehsil(areas.find((a) => a.name === e.target.value)?.tehsil ?? "");
            }}
            className={`${inputClass} mt-1.5 cursor-pointer`}
            aria-invalid={!!errors.locality}
          >
            <option value="">Select your area</option>
            {areas.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name}
              </option>
            ))}
            <option value={OTHER_AREA}>Not listed, I&apos;ll type it</option>
          </select>
        ) : (
          <input
            name="locality"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder="Colony, sector or village"
            maxLength={80}
            className={`${inputClass} mt-1.5`}
            aria-invalid={!!errors.locality}
          />
        )}
        {errors.locality ? (
          <span className="mt-1 block text-xs font-normal text-red-700">{errors.locality}</span>
        ) : (
          tehsil && <span className="mt-1 block text-xs font-normal text-stone-500">Tehsil {tehsil}</span>
        )}
      </label>

      <div className="sm:col-span-2">
        {field("address", "House no., building, street", { autoComplete: "street-address", maxLength: 240 })}
      </div>
      <div className="sm:col-span-2">
        {field(
          "landmark",
          <>
            Landmark <span className="font-normal text-stone-500">(optional)</span>
          </>,
          { placeholder: "e.g. near Gurudwara, opposite the school", maxLength: 80 },
        )}
      </div>
      {field("city", "City / district", { autoComplete: "address-level2", maxLength: 60 })}
      {field("state", "State", { autoComplete: "address-level1", maxLength: 60 })}

      <div className="sm:col-span-2">
        <p className="text-sm font-medium text-stone-900">Save address as</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {QUICK_LABELS.map((q) =>
            chip(q, !otherLabel && label === q, () => {
              setOtherLabel(false);
              setLabel(q);
            }),
          )}
          {chip("Other", otherLabel, () => {
            setOtherLabel(true);
            if (QUICK_LABELS.includes(label)) setLabel("");
          })}
        </div>
        {otherLabel ? (
          <input
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Parents' home, Site office"
            maxLength={30}
            className={`${inputClass} mt-3 sm:max-w-xs`}
          />
        ) : (
          <input type="hidden" name="label" value={label} />
        )}
      </div>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
        >
          {pending ? "Saving…" : (submitLabel ?? (address?.id ? "Save changes" : "Add address"))}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm text-stone-700 hover:text-stone-900 cursor-pointer">
            Cancel
          </button>
        )}
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? (onSaved ? "" : state.ok))}
        </p>
      </div>
    </form>
  );
}
