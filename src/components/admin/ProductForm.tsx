<GenerateDescriptionButton
  productName={formData.name}
  onDescriptionGenerated={handleDescriptionGenerated}
  disabled={!formData.name.trim()}
/>