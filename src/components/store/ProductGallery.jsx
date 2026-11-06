import { useState } from 'react';

export function ProductGallery({ imageUrl, alt, thumbnails = [], width = 640, sizes = '(max-width: 800px) 100vw, 50vw' }) {
  const fallbackImage = `https://placehold.co/${width}x800/e6dfd5/24211f?text=${encodeURIComponent(alt || 'Product')}`;
  const [mainImage, setMainImage] = useState(imageUrl || fallbackImage);
  const imageToLoad = mainImage || fallbackImage;

  function handleError(event) {
    event.currentTarget.src = fallbackImage;
  }

  return (
    <figure className="product-gallery" style={{ margin: 0 }}>
      <div className="product-gallery-stage">
        <img
          src={imageToLoad}
          alt={alt || 'Product'}
          className="product-gallery-image"
          loading="lazy"
          sizes={sizes}
          onError={handleError}
          width={width}
        />
      </div>
      {thumbnails.length > 0 && (
        <div className="product-gallery-thumbnails" aria-label="Image thumbnails">
          {thumbnails.map((thumb, index) => (
            <button
              aria-label={`Image ${index + 1}`}
              className={thumb === mainImage ? 'product-gallery-thumb active' : 'product-gallery-thumb'}
              key={index}
              onClick={() => setMainImage(thumb)}
              type="button"
            >
              <img src={thumb} alt="" className="product-gallery-thumb-image" loading="lazy" sizes="(max-width: 520px) 25vw, (max-width: 800px) 16vw, 8vw" />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
