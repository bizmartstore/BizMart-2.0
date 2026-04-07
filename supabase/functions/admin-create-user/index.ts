import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation schema
const validateCreateUserInput = (input: any): { valid: boolean; error?: string } => {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: "Invalid request body" };
  }

  const { email, password, first_name, last_name, role } = input;

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: "Valid email is required" };
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }

  if (!first_name || typeof first_name !== 'string' || first_name.trim().length === 0) {
    return { valid: false, error: "First name is required" };
  }

  if (!last_name || typeof last_name !== 'string' || last_name.trim().length === 0) {
    return { valid: false, error: "Last name is required" };
  }

  if (role && !['main_admin', 'member_admin', 'customer'].includes(role)) {
    return { valid: false, error: "Invalid role specified" };
  }

  // Sanitize inputs to prevent injection
  const sanitize = (str: string) => str.trim().replace(/[<>]/g, '');

  return {
    valid: true,
    sanitized: {
      email: email.trim().toLowerCase(),
      password: password,
      first_name: sanitize(first_name),
      last_name: sanitize(last_name),
      school: input.school ? sanitize(input.school) : '',
      grade_level: input.grade_level ? sanitize(input.grade_level) : '',
      section: input.section ? sanitize(input.section) : '',
      role: role || 'customer',
    }
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check (simple in-memory, consider Redis for production)
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = `admin-create-user:${clientIP}`;
    const rateLimit = Deno.get(rateLimitKey);
    if (rateLimit && rateLimit >= 10) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    Deno.set(rateLimitKey, (rateLimit || 0) + 1);

    // Set rate limit expiry (1 hour)
    setTimeout(() => Deno.delete(rateLimitKey), 3600000);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin with proper JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller is main_admin or member_admin
    const { data: roleData } = await anonClient.rpc("get_user_role", { _user_id: caller.id });
    if (roleData !== "main_admin" && roleData !== "member_admin") {
      return new Response(JSON.stringify({ error: "Only admins can create accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateCreateUserInput(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, first_name, last_name, school, grade_level, section, role } = validation.sanitized!;

    // Use service role to create user
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        school: school || "",
        grade_level: grade_level || "",
        section: section || "",
      },
    });

    if (createError) {
      console.error("User creation failed:", createError.message);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If role is specified (main_admin or member_admin), assign it
    if (role && newUser.user && (role === "main_admin" || role === "member_admin")) {
      await adminClient.from("user_roles").insert({
        user_id: newUser.user.id,
        role,
      });
    }

    // Log the creation event (audit trail)
    await adminClient.from("admin_audit_logs").insert({
      admin_id: caller.id,
      action: "create_user",
      target_user_id: newUser.user?.id,
      details: { email, role, first_name, last_name },
      ip_address: clientIP,
      user_agent: req.headers.get("user-agent") || "",
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUser.user?.id, 
        email,
        message: "User created successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Admin create user error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});