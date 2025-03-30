import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X } from "lucide-react";
import "./product.css";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string()
    .min(2, { message: "Product name must be at least 2 characters" })
    .max(100, { message: "Product name must be less than 100 characters" }),
  price: z.number({
    required_error: "Price is required",
    invalid_type_error: "Price must be a number",
  }).positive({ message: "Price must be positive" }),
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(1000, { message: "Description must be less than 1000 characters" }),
  category: z.enum(["luxury", "sports", "classic", "smart", "fashion"], {
    required_error: "Please select a category",
  }),
  isAvailable: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Partial<ProductFormValues> & { images?: string[] };
  onSubmit?: (data: ProductFormValues & { images: (string | File)[] }) => Promise<void> | void;
  isEditing?: boolean;
  onCancel?: () => void;
}

const ProductForm = ({
  product = {
    name: "",
    price: undefined,
    description: "",
    category: undefined,
    isAvailable: true,
    images: [],
  },
  onSubmit = () => {},
  isEditing = false,
  onCancel = () => {},
}: ProductFormProps) => {
  const [images, setImages] = useState<string[]>(product.images || []);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...product,
      price: product.price ?? undefined,
    },
  });

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.startsWith('blob:')) {
          URL.revokeObjectURL(image);
        }
      });
    };
  }, [images]);

  const handleSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      if (images.length === 0) {
        form.setError('root', { message: 'At least one image is required' });
        return;
      }
      
      await onSubmit({ 
        ...data, 
        images: files.length > 0 ? files : images 
      });
      
      if (!isEditing) {
        form.reset();
        setImages([]);
        setFiles([]);
      }
    } catch (error) {
      form.setError('root', { 
        message: error instanceof Error ? error.message : 'Submission failed' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);
    
    if (images.length + newFiles.length > MAX_IMAGES) {
      form.setError('root', { message: `Maximum ${MAX_IMAGES} images allowed` });
      return;
    }

    const validFiles = newFiles.filter(file => {
      return ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE;
    });

    if (validFiles.length !== newFiles.length) {
      form.setError('root', {
        message: 'Only JPEG/PNG/WEBP images under 5MB are allowed'
      });
    }

    const newImages = [
      ...images,
      ...validFiles.slice(0, MAX_IMAGES - images.length)
        .map(file => URL.createObjectURL(file))
    ];
    
    setImages(newImages);
    setFiles(prev => [...prev, ...validFiles.slice(0, MAX_IMAGES - images.length)]);
    form.clearErrors('root');
    e.target.value = "";
  }, [images, form]);

  const removeImage = (index: number) => {
    const newImages = [...images];
    if (newImages[index].startsWith('blob:')) {
      URL.revokeObjectURL(newImages[index]);
    }
    newImages.splice(index, 1);
    setImages(newImages);
    
    if (index < files.length) {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setFiles(newFiles);
    }
  };

  return (
    <div className="card">
      <h2 className="mb-4 text-black">{isEditing ? "Edit Watch" : "Add New Watch"}</h2>

      {form.formState.errors.root && (
        <div className="error-message mb-4" role="alert">
          {form.formState.errors.root.message}
        </div>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">Watch Name</label>
          <input
            id="name"
            type="text"
            className="form-input"
            placeholder="Enter watch name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="error-message" role="alert">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="price" className="form-label">Price</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            placeholder="0.00"
            aria-invalid={!!form.formState.errors.price}
            {...form.register("price", {
              valueAsNumber: true,
              validate: (value) => !isNaN(value) || "Price must be a number"
            })}
          />
          <p className="hint-text">Enter the price in your local currency</p>
          {form.formState.errors.price && (
            <p className="error-message" role="alert">
              {form.formState.errors.price.message}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            className="form-textarea"
            placeholder="Enter watch description"
            aria-invalid={!!form.formState.errors.description}
            {...form.register("description")}
          />
          <div className="flex justify-between">
            {form.formState.errors.description ? (
              <p className="error-message" role="alert">
                {form.formState.errors.description.message}
              </p>
            ) : (
              <span>&nbsp;</span>
            )}
            <span className="text-sm text-gray-500">
              {form.watch("description")?.length || 0}/1000
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category" className="form-label">Category</label>
          <select
            id="category"
            className="form-select"
            aria-invalid={!!form.formState.errors.category}
            {...form.register("category")}
          >
            <option value="" disabled>Select a category</option>
            <option value="luxury">Luxury</option>
            <option value="sports">Sports</option>
            <option value="classic">Classic</option>
            <option value="smart">Smart</option>
            <option value="fashion">Fashion</option>
          </select>
          {form.formState.errors.category && (
            <p className="error-message" role="alert">
              {form.formState.errors.category.message}
            </p>
          )}
        </div>

        <div className="form-group">
          <div className="card p-4">
            <div className="flex justify-between items-center">
              <div>
                <label htmlFor="isAvailable" className="form-label mb-1">
                  Availability
                </label>
                <p className="hint-text">
                  Set whether this watch is currently available for delivery
                </p>
              </div>
              <div>
                <label className="checkbox-container">
                  <input
                    id="isAvailable"
                    type="checkbox"
                    className="checkbox"
                    {...form.register("isAvailable")}
                  />
                  <span>Available</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Watch Images</label>
          <div className="image-upload">
            {images.map((image, index) => (
              <div key={index} className="image-preview">
                <img 
                  src={image} 
                  alt={`Watch preview ${index + 1}`} 
                  className="image-preview-img"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="image-remove-btn"
                  aria-label={`Remove image ${index + 1}`}
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className="image-upload-placeholder">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={24} className="upload-icon" />
                  <p className="upload-text">Upload image</p>
                </div>
                <input
                  type="file"
                  id="image-upload"
                  className="image-upload-input"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleImageUpload}
                  multiple={images.length < MAX_IMAGES - 1}
                  disabled={isSubmitting}
                />
              </label>
            )}
          </div>
          <p className="hint-text">
            Upload up to {MAX_IMAGES} watch images (JPEG, PNG, WEBP under 5MB).
            Recommended size: 800x800px.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="spinner"></span>
                Processing...
              </span>
            ) : isEditing ? (
              "Update Watch"
            ) : (
              "Add Watch"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;