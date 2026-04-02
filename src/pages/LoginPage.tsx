@@
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     
     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
     setLoading(false);
     
     if (error) {
       if (error.message.toLowerCase().includes("email not confirmed")) {
         setUnconfirmed(true);
         setErrorMsg("You need to confirm your email before you can log in.");
         toast({ 
           title: "Email not verified", 
           description: "Please check your Gmail to confirm your account.", 
           variant: "destructive" 
         });
       } else {
         toast({ title: "Login failed", description: error.message, variant: "destructive" });
       }
     } else {
       toast({ title: "Welcome back! 🎉" });
       
       // NEW: Navigate admin to /admin, others to home
       if (data.user) {
         const { data: roleData } = await (supabase as any).rpc('get_user_role', { _user_id: data.user.id });
         if (roleData === 'main_admin' || roleData === 'member_admin') {
           navigate('/admin');
         } else {
           navigate('/');
         }
       }
     }
   };
@@
   <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={loading}>
     {loading ? "Creating..." : "Sign Up"}
   </Button>
 </div>
</div>
 
+{/* NEW: Handle unconfirmed email banner */}
+{unconfirmed && (
+  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in slide-in-from-top-2">
+    <div className="flex items-center gap-2 mb-2">
+      <AlertCircle className="h-4 w-4 text-destructive" />
+      <span className="text-xs font-bold text-destructive">Verification Required</span>
+    </div>
+    <p className="text-[10px] text-destructive/80 mb-3 leading-relaxed">
+      {errorMsg || "You need to confirm your email before you can log in. Please check your Gmail for the verification link."}
+    </p>
+    <Button 
+      onClick={handleResend} 
+      disabled={resending} 
+      variant="outline" 
+      size="sm" 
+      className="w-full h-9 text-[10px] font-bold border-destructive/30 text-destructive hover:bg-destructive/5"
+    >
+      {resending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
+      Resend Verification Link
+    </Button>
+  </div>
+)}