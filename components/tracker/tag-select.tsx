"use client";

import { useMemo, useState } from "react";
import { Check, Tag as TagIcon } from "lucide-react";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function TagSelect({
  tags,
  value,
  onChange,
  className,
}: {
  tags: Tag[];
  value: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      tags.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tags, search]
  );

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const label =
    value.length === 0
      ? "Tags"
      : value.length === 1
        ? tags.find((t) => t.id === value[0])?.name ?? "1 tag"
        : `${value.length} tags`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent",
              className
            )}
          />
        }
      >
          <TagIcon
            className={cn(
              "h-4 w-4",
              value.length ? "text-[#03A9F4]" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "truncate",
              value.length === 0 && "text-muted-foreground"
            )}
          >
            {label}
          </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="border-b p-2">
          <Input
            autoFocus
            placeholder="Buscar tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Nenhuma tag.
            </p>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border",
                  value.includes(t.id)
                    ? "border-[#03A9F4] bg-[#03A9F4] text-white"
                    : "border-input"
                )}
              >
                {value.includes(t.id) && <Check className="h-3 w-3" />}
              </span>
              <span className="truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
