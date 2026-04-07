// ... existing code ...

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selected = e.target.files?.[0];
  if (!selected) return;

  // Validate file type
  if (selected.type !== "application/pdf") {
    toast.error("Only PDF files are allowed");
    return;
  }

  // Validate file size (50MB max)
  if (selected.size > 50 * 1024 * 1024) {
    toast.error("File size must be less than 50MB");
    return;
  }

  // Validate filename (no special characters that could be used for path traversal)
  const filename = selected.name;
  if (/[<>:"/\\|?*]/.test(filename)) {
    toast.error("Filename contains invalid characters");
    return;
  }

  setFile(selected);
  setPages([]);
  await analyzePdf(selected);
};