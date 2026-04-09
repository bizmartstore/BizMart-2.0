// Ensure user is typed; it comes from useAuth or props
  const { user } = useAuth(); // make sure this hook is imported
  // In channel filter use `${user?.id}` safely