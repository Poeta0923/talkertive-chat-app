"use server";

import { appControllerTestUser } from "@/generated/openapi-client";

export async function getUserTest(token?: string) {
  const { data, error } = await appControllerTestUser();
  return {
    data,
    error,
  };
}
