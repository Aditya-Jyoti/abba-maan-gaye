"use client";

import { useRef, useState, type ComponentProps } from "react";
import { Photo } from "@/components/Photo";
import type { Photo as PhotoData } from "@/db/schema";
import type { EditApi } from "./api";
import styles from "./editor.module.css";

type Props = Omit<ComponentProps<typeof Photo>, "children"> & {
  edit: EditApi;
  onChange: (photo: PhotoData) => void;
};

/** A photo with upload, replace and remove controls. Accepts a dropped image file too. */
export function PhotoSlot({ edit, onChange, photo, ...photoProps }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const take = async (files: File[]) => {
    const file = files.find((f) => f.type.startsWith("image/")) ?? files[0];
    if (!file || busy) return;
    setBusy(true);
    try {
      const [image] = await edit.upload([file]);
      if (image) onChange({ caption: photo?.caption ?? "", image });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Photo photo={photo} {...photoProps}>
      <div
        className={`${styles.slot} ${photo?.image ? "" : styles.slotEmpty} ${over ? styles.slotOver : ""} ${busy ? styles.slotBusy : ""}`}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take([...e.dataTransfer.files]);
        }}
      >
        {busy ? (
          <span className={styles.slotNote}>Uploading...</span>
        ) : (
          <span className={styles.slotButtons}>
            <button type="button" className={styles.chip} onClick={() => input.current?.click()}>
              {photo?.image ? "Replace photo" : "Upload photo"}
            </button>
            {photo?.image && (
              <button
                type="button"
                className={styles.chip}
                onClick={() => onChange({ caption: photo.caption })}
                aria-label="Remove photo, keep caption"
              >
                Remove
              </button>
            )}
          </span>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void take([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </div>
    </Photo>
  );
}

/** A tile that uploads any number of images, for the camera roll. */
export function AddPhotos({ edit, onAdd, className }: { edit: EditApi; onAdd: (photos: PhotoData[]) => void; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [over, setOver] = useState(false);

  const take = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setBusy(images.length);
    try {
      const refs = await edit.upload(images);
      if (refs.length) onAdd(refs.map((image) => ({ caption: "", image })));
    } finally {
      setBusy(0);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.addPhotos} ${over ? styles.slotOver : ""} ${className ?? ""}`}
      onClick={() => input.current?.click()}
      disabled={busy > 0}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void take([...e.dataTransfer.files]);
      }}
    >
      <span className={styles.addPhotosPlus}>+</span>
      {busy ? `Uploading ${busy} ${busy === 1 ? "photo" : "photos"}...` : "Add photos"}
      <span className={styles.addPhotosHint}>or drop them here</span>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void take([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </button>
  );
}
