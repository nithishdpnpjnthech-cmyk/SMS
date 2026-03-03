from PIL import Image, ImageDraw

def make_truly_transparent(input_path, output_path):
    # Load the image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Create a new image for the result
    new_data = []
    
    # Define "white" threshold - any pixel with all RGB values > 220 is considered background
    # Looking at the sample, the "white" is very pure.
    threshold = 220
    
    pixels = img.getdata()
    for item in pixels:
        # If the pixel is very light (approaching white), make it transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    
    # Now apply a circular mask to clean up any remaining outside bits
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Find the bounds of the non-transparent area to center the circle
    # More generally, let's just use the same coordinates as before but slightly tighter
    margin = 5
    left = margin
    top = 45 # The logo is slightly offset in the original upload
    right = width - margin
    bottom = width + 45 - margin
    
    draw.ellipse((left, top, right, bottom), fill=255)
    
    # Apply mask
    result = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask=mask)
    
    # Crop to the circle
    result = result.crop((left, top, right, bottom))
    
    # Save the result
    result.save(output_path, "PNG")
    print(f"Successfully processed logo and saved to {output_path}")

if __name__ == "__main__":
    original_upload = '/Users/kamakshivalli/.gemini/antigravity/brain/12bd7fd0-02e0-475b-b5e1-459b6a4e79a9/uploaded_media_1772521613064.png'
    target_path = '/Users/kamakshivalli/SMS/client/public/logo.png'
    make_truly_transparent(original_upload, target_path)
