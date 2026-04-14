"use client";

import { supabase } from "@/integrations/supabase/client";

/**
 * Gets an existing chat session for a report, or creates a new one if it doesn't exist.
 * @param reportId - The ID of the support report
 * @returns The chat session ID
 */
export async function getOrCreateChatSession(reportId: string): Promise<string> {
  try {
    // First, try to find an existing session for this report
    const { data: existingSession, error: fetchError } = await (supabase as any)
      .from("support_chat_sessions")
      .select("id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching chat session:", fetchError);
      throw fetchError;
    }

    // If session exists, return its ID
    if (existingSession?.id) {
      return existingSession.id;
    }

    // If no session exists, create a new one
    const { data: newSession, error: insertError } = await (supabase as any)
      .from("support_chat_sessions")
      .insert({
        report_id: reportId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating chat session:", insertError);
      throw insertError;
    }

    if (!newSession?.id) {
      throw new Error("Failed to create chat session");
    }

    return newSession.id;
  } catch (error) {
    console.error("Failed to get or create chat session:", error);
    throw error;
  }
}

/**
 * Sends a message in a chat session
 * @param sessionId - The chat session ID
 * @param senderId - The user ID of the sender
 * @param message - The message content
 * @returns The created message
 */
export async function sendSupportMessage(
  sessionId: string,
  senderId: string,
  message: string
) {
  try {
    const { data: newMessage, error } = await (supabase as any)
      .from("support_messages")
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending support message:", error);
      throw error;
    }

    return newMessage;
  } catch (error) {
    console.error("Failed to send support message:", error);
    throw error;
  }
}