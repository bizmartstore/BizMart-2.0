// 2. If profile is missing, create it
        if (!profData && !profError) {
          console.log("[AuthContext] Profile missing, creating...");
          const { data: newProf, error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: currentUser.id,
              email: currentUser.email,
              first_name: metadata.first_name || '',
              last_name: metadata.last_name || '',
              school: metadata.school || '',
              section: metadata.section || '',
              grade_level: metadata.grade_level || '',
              bcoins: 0
            })
            .select()
            .single();
          
          if (!insertError) profData = newProf;
          else console.warn("[AuthContext] Profile creation failed:", insertError.message);
        }