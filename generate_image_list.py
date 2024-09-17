import os
import json

def generate_image_pairs(directory):
    image_files = [f for f in os.listdir(directory) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
    pairs = []
    for image in image_files:
        base_name = image.rsplit('_', 1)[0]
        pair = next((p for p in pairs if p['name'] == base_name), None)
        if not pair:
            pair = {'name': base_name, 'before': '', 'after': ''}
            pairs.append(pair)
        if image.endswith('_a.jpg'):
            pair['before'] = f'imgSlider/{image}'
        elif image.endswith('_b.jpg'):
            pair['after'] = f'imgSlider/{image}'
    return pairs

if __name__ == "__main__":
    imgSlider_dir = "imgSlider"
    output_file = os.path.join(imgSlider_dir, "image_list.json")
    
    image_pairs = generate_image_pairs(imgSlider_dir)
    
    with open(output_file, "w") as f:
        json.dump(image_pairs, f, indent=2)
    
    print(f"image_list.json has been generated in {imgSlider_dir}/")
    print(f"Found {len(image_pairs)} image pairs:")
    for pair in image_pairs:
        print(f"  {pair['name']}: {pair['before']} | {pair['after']}")