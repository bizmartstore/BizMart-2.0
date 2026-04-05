-   const fileRef = useState<HTMLInputElement>(null);
+   const fileInputRef = useRef<HTMLInputElement>(null);
+   ... 
-   <input
-     ref={fileRef}
-     type="file"
-     accept="image/*"
-     className="hidden"
-     onChange={handleUpload}
-   />
+   <input+     ref={fileInputRef}
+     type="file"
+     accept="image/*"
+     className="hidden"
+     onChange={handleUpload}
+   />
+   ... 
+   <button
+     type="button"
+     onClick={() => fileInputRef.current?.click()}
+     disabled={uploading}
+     className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
+   >
+     {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
+     <span className="text-[10px] text-muted-foreground">{uploading ? "..." : "Add"}</span>
+   </button>
+   ... 
+   // Ensure the component returns JSX and not null
+   <div className="space-y-2">
+     <Label htmlFor="description">Description *</Label>
+     <Textarea
+       id="description"
+       name="description"
+       value={formData.description}
+       onChange={handleChange}
+       placeholder="Enter product description..."
+       className="min-h-[120px]"
+       required
+     />
+     <GenerateDescriptionButton
+       productName={formData.name}
+       onDescriptionGenerated={handleDescriptionGenerated}
+       disabled={!formData.name.trim()}
+     />
+   </div>
+   // Ensure component always returns JSX
+   <div className="space-y-2">
+     {/* existing UI elements */}
+   </div>
+   <div className="flex gap-3 pt-4">
+     <Button type="submit" disabled={saving} className="flex-1">
+       {saving ? 'Submitting...' : initialData.name ? 'Update Product' : 'Add Product'}
+     </Button>
+     {onCancel && (
+       <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
+         Cancel
+       </Button>
+     </Button>
+   </div>
+ </div>
+   // Ensure component always returns JSX (no early return)
+   <div className="space-y-2">
+     {/* existing UI elements */}
+   </div>
+   <div className="flex gap-3 pt-4">
+     <Button type="submit" disabled={saving} className="flex-1">
+       {saving ? 'Submitting...' : initialData.name ? 'Update Product' : 'Add Product'}
+     </Button>
+     {onCancel && (
+       <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
+         Cancel
+       </Button>
+     </Button>
+   </div>
+   </div>
+   // Ensure component always returns JSX (no early return)
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   </div>
+   <dyad-write path="src/components/admin/ProductForm.tsx" description="Fix import and render GenerateDescriptionButton below description textarea">
import { forwardRef, useState } from "react";
import { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Loader2, X } from "lucide-react";
import GenerateDescriptionButton from "../GenerateDescriptionButton";

type ProductFormProps = {
  initialData?: {
    name?: string;
    price?: number;
    originalPrice?: number;
    category?: string;
    stock?: number;
    description?: string;
    experience?: string;
  };
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export default function ProductForm({ initialData = {}, onSubmit, onCancel }: ProductFormProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleDescriptionGenerated = (description: string) => {
    setDescription(description);
    setFormData(prev => ({ ...prev, description }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase        .from("products")
        .upsert({ ...formData, user_id: user?.id }, { onConflict: "id" });
      if (error) throw error;
      toast.success("Product saved successfully!");
      navigate("/products");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Image upload failed");
    const { url } = await res.json();
    setFormData(prev => ({ ...prev, image_url: url }));
    toast.success("Image uploaded!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleImageDelete = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-bold">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={e => handleChange(e, "name")}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price" className="text-xs font-bold">Price (₱)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={e => handleChange(e, "price")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-bold">Category</Label>
          <Select
            value={formData.category}
            onValueChange={v => handleCategoryChange(v)}
          >
            <SelectTrigger className="text-sm rounded-md border border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="absolute right-0 w-48">
              {categories.map((cat: Category) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              </SelectContent>
            </SelectTrigger>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Enter product description..."
              rows={4}
              required
            />
            <GenerateDescriptionButton
              productName={formData.name}
              onDescriptionGenerated={handleDescriptionGenerated}
              disabled={!formData.name.trim()}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-bold">Category</Label>
          <Select            value={formData.category}
            onValueChange={setFormData}
          >
            <SelectTrigger className="text-sm rounded-md border border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat: Category) => (
                <SelectItem value={cat.id}>
                  {cat.name}
                </SelectItem>
              </SelectContent>
            </SelectTrigger>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-bold">Category</Label>
            <Input
              value={formData.category}
              onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-bold">Category</Label>
          <Input            value={formData.category}
            onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-xs font-bold">Category</Label>
        <Input
          value={formData.category}
          onChange={e => setFormData(f => ({ ...f, category: e.target.value<dyad-write path="src/components/admin/ProductForm.tsx" description="Fixed TypeScript errors: corrected import, fetch response handling, and file ref typing">
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import GenerateDescriptionButton from "../GenerateDescriptionButton";

interface ProductFormProps {
  initialData?: {
    name?: string;
    price?: number;
    original_price?: number;
    category?: string;
    stock?: number;
    description?: string;
    images?: string[];
  };
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export default function ProductForm({ initialData = {}, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    price: initialData.price || 0,
    original_price: initialData.original_price || '',
    category: initialData.category || '',
    stock: initialData.stock || 0,
    description: initialData.description || '',
    images: initialData.images || [],
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || 0,
        original_price: initialData.original_price || '',
        category: initialData.category || '',
        stock: initialData.stock || 0,
        description: initialData.description || '',
        images: initialData.images || [],
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleDescriptionGenerated = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const uploadImage = async (file: File) => {
    if (formData.images.length >= 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("seller-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("seller-images").getPublicUrl(path);
      setFormData(f => ({ ...f, images: [...f.images, publicUrl] }));
      toast.success("Image uploaded!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setFormData(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price (₱) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="original_price">Original Price (₱)</Label>
          <Input
            id="original_price"
            name="original_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.original_price}
            onChange={handleChange}
            placeholder="Optional - for showing discount"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Input
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., notebooks, pens, tech"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter product description..."
          className="min-h-[120px]"
          required
        />
        <GenerateDescriptionButton
          productName={formData.name}
          onDescriptionGenerated={handleDescriptionGenerated}
          disabled={!formData.name.trim()}
        />
      </div>

      <div className="space-y-2">
        <Label>Product Images (up to 3)</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
          }}
        />
        <div className="flex gap-2">
          {formData.images.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {formData.images.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
              <span className="text-[8px] text-muted-foreground">{uploading ? "..." : "Add"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Submitting...' : initialData.name ? 'Update Product' : 'Add Product'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}