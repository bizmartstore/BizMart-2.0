/* ... existing imports ... */

export default function SignUpPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    section: "",
    gradeLevel: "",
    school: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
        // Validate password length
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    // Sign up with email verification    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          section: form.section,
          grade_level: form.gradeLevel,
          school: form.school,
        },
        // Important: Send verification email automatically
        email_confirm: true,
        // Use the correct "From" address for verification emails
        // (Configured in Supabase dashboard > Settings > Email)
      },
    });
    
    setLoading(false);
        if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }

    // Show verification message instead of navigating immediately
    toast({
      title: "Verification Email Sent!",
      description: "Please check your email (including spam folder) for a verification link. We've sent it to the email you provided.",
      status: "success"
    });

    // Navigate to verification page instead of home
    navigate("/verify-email");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary px-4 pt-6 pb-6 rounded-b-[2rem]">
        <button onClick={() => navigate(-1)} className="mb-3">
          <ArrowLeft className="h-5 w-5 text-primary-foreground" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="h-6 w-6 text-primary-foreground" />
          <h1 className="text-xl font-extrabold text-primary-foreground">Create Account</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">Join BizMart Store today!</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-5 pb-8 overflow-y-auto">
        <form onSubmit={handleSignUp} className="space-y-3">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Last Name</Label>
              <Input
                placeholder="Dela Cruz"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">First Name</Label>
              <Input
                placeholder="Juan"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                required
              />
            </div>
          </div>

          {/* School & Grade */}
          <div className="space-y-1">
            <Label className="text-xs font-bold">School</Label>
            <Input              placeholder="Enter your school name"
              value={form.school}
              onChange={(e) => update("school", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Grade Level</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.gradeLevel}
                onChange={(e) => update("gradeLevel", e.target.value)}
                required
              >
                <option value="">Select grade</option>
                <option>Grade 7</option>
                <option>Grade 8</option>
                <option>Grade 9</option>
                <option>Grade 10</option>
                <option>Grade 11</option>
                <option>Grade 12</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Section</Label>
              <Input
                placeholder="e.g. Section A"
                value={form.section}
                onChange={(e) => update("section", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email & Password */}
          <div className="space-y-1">
            <Label className="text-xs font-bold">Email Address</Label>
            <Input
              type="email"
              placeholder="student@school.edu"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={6}
              />
              <button                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Input
                type="checkbox"
                id="terms"
                required
              />
              <span className="ml-2 text-xs font-normal">
                I agree to the <span className="text-primary font-medium">Terms of Service</span>
              </span>
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-sm font-bold rounded-xl"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}