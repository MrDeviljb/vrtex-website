export interface AluuPlayerResult {
  success: boolean;
  message?: string;
  player?: {
    uid: string;
    username: string;
  };
}

export async function verifyBgmiUidWithAluu(uid: string): Promise<AluuPlayerResult> {
  const cleanUid = uid.trim();

  if (!cleanUid) {
    return {
      success: false,
      message: "Please enter a BGMI UID.",
    };
  }

  if (!/^\d+$/.test(cleanUid)) {
    return {
      success: false,
      message: "BGMI UID must contain numbers only.",
    };
  }

  const apiKey = process.env.ALUU_API_KEY;
  if (!apiKey) {
    console.error("ALUU ERROR: ALUU_API_KEY is not configured in environment.");
    return {
      success: false,
      message: "Verification service is temporarily unavailable.",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const url = new URL("https://aluu.in/api/check/bgmi");
    url.searchParams.set("gameCode", "bgmi");
    url.searchParams.set("id", cleanUid);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      return {
        success: false,
        message: "Verification limit reached. Please try again later.",
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        message: "BGMI player not found.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: "Unable to verify BGMI UID right now.",
      };
    }

    const data = await response.json();

    if (!data || !data.success) {
      return {
        success: false,
        message: data?.message || "BGMI player not found.",
      };
    }

    const payload = data.data || {};
    const isValid = payload.isValid;
    const username = payload.username;

    if (!isValid || !username) {
      return {
        success: false,
        message: "BGMI player not found.",
      };
    }

    return {
      success: true,
      player: {
        uid: cleanUid,
        username: String(username),
      },
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        message: "Verification request timed out. Please try again.",
      };
    }
    console.error("Aluu API fetch error:", error?.message || error);
    return {
      success: false,
      message: "Unable to verify BGMI account. Please try again.",
    };
  }
}

export async function verifyBgmiUid(uid: string) {
  const result = await verifyBgmiUidWithAluu(uid);
  return {
    success: result.success,
    message: result.message,
    data: result.player ? { inGameName: result.player.username, id: result.player.uid } : null,
  };
}

