"use client";

import { useEffect, useState } from "react";
import { servicesApi } from "@/lib/api/services";
import { MOCK_SKILLS } from "@/lib/mock-services";

/**
 * Skill pills derived from live listings, so every pill matches the real
 * taxonomy and a click always yields at least one result. Falls back to the
 * bundled mock skills only when the API is unreachable — the same condition
 * that switches browse surfaces into preview mode.
 */
export function useCatalogSkills(max = 8): readonly string[] {
  const [skills, setSkills] = useState<readonly string[]>([]);
  const [apiDown, setApiDown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await servicesApi.list({ limit: 50 });
        if (cancelled) return;
        const counts = new Map<string, number>();
        for (const service of data) {
          for (const skill of service.skills ?? []) {
            counts.set(skill, (counts.get(skill) ?? 0) + 1);
          }
        }
        const top = [...counts.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, max)
          .map(([skill]) => skill);
        setSkills(top);
        setApiDown(top.length === 0);
      } catch {
        if (!cancelled) setApiDown(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [max]);

  if (skills.length > 0) return skills;
  return apiDown ? MOCK_SKILLS : [];
}
