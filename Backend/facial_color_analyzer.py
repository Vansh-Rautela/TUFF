import cv2
import numpy as np
import colorsys
import math
import os
import mediapipe as mp

class FacialColorAnalyzer:
    def __init__(self):
        """
        Initialize the Facial Color Analyzer using MediaPipe face detection
        """
        try:
            # Initialize MediaPipe Face Detection
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_drawing = mp.solutions.drawing_utils
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=0,  # Changed to 0 for close-range detection
                min_detection_confidence=0.5  # Reduced for close-up photos
            )
            
            # Initialize MediaPipe Face Mesh for more detailed landmarks
            self.mp_face_mesh = mp.solutions.face_mesh
            # Try with refine_landmarks first, fallback if not supported
            try:
                self.face_mesh = self.mp_face_mesh.FaceMesh(
                    static_image_mode=True,
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.5,  # Reduced confidence threshold
                    min_tracking_confidence=0.5
                )
            except TypeError:
                # Fallback for older MediaPipe versions without refine_landmarks
                self.face_mesh = self.mp_face_mesh.FaceMesh(
                    static_image_mode=True,
                    max_num_faces=1,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
        except Exception as e:
            raise RuntimeError(f"Failed to initialize MediaPipe: {str(e)}")
        
    def rgb_to_lab(self, r, g, b):
        """Convert RGB to LAB color space"""
        # Normalize RGB values
        r = r / 255.0
        g = g / 255.0
        b = b / 255.0

        # Apply gamma correction
        r = ((r + 0.055) / 1.055) ** 2.4 if r > 0.04045 else r / 12.92
        g = ((g + 0.055) / 1.055) ** 2.4 if g > 0.04045 else g / 12.92
        b = ((b + 0.055) / 1.055) ** 2.4 if b > 0.04045 else b / 12.92

        # Convert to XYZ
        x = r * 0.4124 + g * 0.3576 + b * 0.1805
        y = r * 0.2126 + g * 0.7152 + b * 0.0722
        z = r * 0.0193 + g * 0.1192 + b * 0.9505

        # Normalize by D65 illuminant
        x = x / 0.95047
        y = y / 1.00000
        z = z / 1.08883

        # Convert to LAB
        x = x ** (1/3) if x > 0.008856 else (7.787 * x + 16/116)
        y = y ** (1/3) if y > 0.008856 else (7.787 * y + 16/116)
        z = z ** (1/3) if z > 0.008856 else (7.787 * z + 16/116)

        L = (116 * y) - 16
        a = 500 * (x - y)
        b_lab = 200 * (y - z)

        return {"L": L, "a": a, "b": b_lab}

    def delta_e_2000(self, lab1, lab2):
        """Calculate color distance using simplified CIE2000 formula"""
        delta_l = lab2["L"] - lab1["L"]
        delta_a = lab2["a"] - lab1["a"]
        delta_b = lab2["b"] - lab1["b"]
        
        return math.sqrt(delta_l * delta_l + delta_a * delta_a + delta_b * delta_b)

    def is_skin_color_relaxed(self, r, g, b, is_close_up=False):
        """
        More relaxed skin color detection for close-up photos
        """
        # Convert to different color spaces for analysis
        h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
        h = h * 360  # Convert hue to degrees
        s = s * 100  # Convert to percentage
        v = v * 100  # Convert to percentage
        
        if is_close_up:
            # More relaxed criteria for close-up photos
            hue_condition = (h >= 0 and h <= 60) or (h >= 320 and h <= 360)  # Expanded range
            saturation_condition = s >= 5 and s <= 90  # More relaxed saturation
            brightness_condition = v >= 15 and v <= 98  # More relaxed brightness
            
            # More relaxed RGB ratios
            rgb_condition = r >= g * 0.75 and g >= b * 0.6  # More forgiving ratios
            not_too_saturated = (max(r, g, b) - min(r, g, b)) < 120  # Less strict
        else:
            # Original criteria for regular photos
            hue_condition = (h >= 0 and h <= 50) or (h >= 340 and h <= 360)
            saturation_condition = s >= 10 and s <= 80
            brightness_condition = v >= 20 and v <= 95
            rgb_condition = r >= g * 0.85 and g >= b * 0.7
            not_too_saturated = (max(r, g, b) - min(r, g, b)) < 80
        
        return (hue_condition and saturation_condition and brightness_condition 
                and rgb_condition and not_too_saturated)

    def is_close_up_photo(self, face_region, image_shape):
        """
        Detect if this is a close-up photo based on face size relative to image
        """
        height, width = image_shape[:2]
        face_area = face_region["width"] * face_region["height"]
        image_area = height * width
        
        # If face takes up more than 40% of image, consider it close-up
        face_ratio = face_area / image_area
        return face_ratio > 0.4

    def get_face_region_mediapipe(self, image):
        """
        Detect face region using MediaPipe Face Detection with improved accuracy
        """
        height, width = image.shape[:2]
        
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Try both detection models
        results = self.face_detection.process(rgb_image)
        
        if not results.detections:
            # Try with the other model if first fails
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=1,  # Full-range model
                min_detection_confidence=0.5
            )
            results = self.face_detection.process(rgb_image)
        
        if results.detections:
            # Get the most confident detection
            best_detection = max(results.detections, key=lambda x: x.score[0])
            bbox = best_detection.location_data.relative_bounding_box
            
            # Convert relative coordinates to absolute coordinates
            face_region = {
                "x": int(bbox.xmin * width),
                "y": int(bbox.ymin * height),
                "width": int(bbox.width * width),
                "height": int(bbox.height * height),
                "confidence": best_detection.score[0]
            }
            
            # Adaptive padding based on face size
            padding_ratio = 0.05 if self.is_close_up_photo(face_region, image.shape) else 0.1
            padding_x = int(face_region["width"] * padding_ratio)
            padding_y = int(face_region["height"] * padding_ratio)
            
            face_region["x"] = max(0, face_region["x"] - padding_x)
            face_region["y"] = max(0, face_region["y"] - padding_y)
            face_region["width"] = min(face_region["width"] + 2 * padding_x, 
                                     width - face_region["x"])
            face_region["height"] = min(face_region["height"] + 2 * padding_y, 
                                      height - face_region["y"])
            
            return face_region
        
        return None

    def get_face_landmarks(self, image):
        """
        Get detailed face landmarks using MediaPipe Face Mesh
        """
        height, width = image.shape[:2]
        
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image
        results = self.face_mesh.process(rgb_image)
        
        if results.multi_face_landmarks:
            landmarks = []
            for face_landmarks in results.multi_face_landmarks:
                for landmark in face_landmarks.landmark:
                    x = int(landmark.x * width)
                    y = int(landmark.y * height)
                    landmarks.append({"x": x, "y": y})
            return landmarks
        
        return None

    def get_skin_sampling_points_adaptive(self, face_region, landmarks=None, is_close_up=False):
        """
        Adaptive sampling points based on whether it's a close-up photo
        """
        if landmarks and len(landmarks) > 400:
            # Use specific landmark indices for skin areas only
            if is_close_up:
                # More conservative landmark selection for close-ups
                skin_landmark_indices = [
                    # Central forehead
                    9, 10,
                    # Central cheek areas
                    116, 117, 142, 345, 346, 371,
                    # Nose bridge
                    6, 51, 115, 131, 220, 305,
                    # Central chin
                    175, 199
                ]
            else:
                # Original extensive landmark selection
                skin_landmark_indices = [
                    9, 151, 116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 206, 207, 213, 192, 147,
                    345, 346, 347, 348, 349, 350, 355, 371, 266, 425, 426, 427, 436, 416, 376,
                    6, 51, 48, 115, 131, 134, 102, 49, 220, 305, 290, 331, 294, 278,
                    175, 199, 200, 9, 10, 151
                ]
            
            sampling_points = []
            for idx in skin_landmark_indices:
                if idx < len(landmarks):
                    sampling_points.append({
                        "x": landmarks[idx]["x"],
                        "y": landmarks[idx]["y"]
                    })
            
            return sampling_points
        
        else:
            # Region-based sampling with adaptation for close-ups
            x, y, width, height = face_region["x"], face_region["y"], face_region["width"], face_region["height"]
            
            if is_close_up:
                # More conservative margins for close-ups
                inner_margin_x = width * 0.1
                inner_margin_y = width * 0.05
                
                sampling_points = [
                    # Central areas only
                    {"x": x + width * 0.5, "y": y + height * 0.3},  # Forehead
                    {"x": x + width * 0.35, "y": y + height * 0.5},  # Left cheek
                    {"x": x + width * 0.65, "y": y + height * 0.5},  # Right cheek
                    {"x": x + width * 0.5, "y": y + height * 0.45},  # Nose
                    {"x": x + width * 0.5, "y": y + height * 0.7},   # Chin
                ]
            else:
                # Original extensive sampling
                inner_margin_x = width * 0.15
                inner_margin_y = height * 0.1
                
                sampling_points = [
                    {"x": x + width * 0.5, "y": y + height * 0.25},
                    {"x": x + inner_margin_x + width * 0.25, "y": y + height * 0.5},
                    {"x": x + inner_margin_x + width * 0.35, "y": y + height * 0.6},
                    {"x": x + width * 0.65 - inner_margin_x, "y": y + height * 0.5},
                    {"x": x + width * 0.75 - inner_margin_x, "y": y + height * 0.6},
                    {"x": x + width * 0.5, "y": y + height * 0.45},
                    {"x": x + width * 0.5, "y": y + height * 0.75},
                    {"x": x + width * 0.35, "y": y + height * 0.45},
                    {"x": x + width * 0.65, "y": y + height * 0.45}
                ]
            
            return sampling_points

    def sample_skin_colors_adaptive(self, image, sampling_points, is_close_up=False):
        """
        Adaptive color sampling with relaxed validation for close-ups
        """
        height, width = image.shape[:2]
        valid_color_samples = []
        
        # Larger sampling area for close-ups to get more data
        sample_radius = 3 if is_close_up else 2
        min_valid_samples = 2 if is_close_up else 3  # More lenient for close-ups
        
        for point in sampling_points:
            x = int(max(0, min(width - 1, point["x"])))
            y = int(max(0, min(height - 1, point["y"])))
            
            # Sample from larger area for close-ups
            sample_colors = []
            for dx in range(-sample_radius, sample_radius + 1):
                for dy in range(-sample_radius, sample_radius + 1):
                    sample_x = max(0, min(width - 1, x + dx))
                    sample_y = max(0, min(height - 1, y + dy))
                    
                    # OpenCV uses BGR, convert to RGB
                    b, g, r = image[sample_y, sample_x]
                    
                    # Use appropriate skin color validation
                    if self.is_skin_color_relaxed(r, g, b, is_close_up):
                        sample_colors.append({"r": int(r), "g": int(g), "b": int(b)})
            
            # More lenient requirement for valid samples
            if len(sample_colors) >= min_valid_samples:
                # Use median color to avoid outliers
                r_values = [c["r"] for c in sample_colors]
                g_values = [c["g"] for c in sample_colors]
                b_values = [c["b"] for c in sample_colors]
                
                median_color = {
                    "r": int(np.median(r_values)),
                    "g": int(np.median(g_values)),
                    "b": int(np.median(b_values))
                }
                
                # Double-check with relaxed validation
                if self.is_skin_color_relaxed(median_color["r"], median_color["g"], median_color["b"], is_close_up):
                    # Add LAB values
                    lab = self.rgb_to_lab(median_color["r"], median_color["g"], median_color["b"])
                    median_color["lab"] = lab
                    valid_color_samples.append(median_color)
        
        return valid_color_samples

    def remove_outliers_adaptive(self, color_samples, is_close_up=False):
        """
        Adaptive outlier removal - more lenient for close-ups
        """
        if len(color_samples) < 2:
            return color_samples
        
        # Skip outlier removal for very few samples or close-ups
        if len(color_samples) <= 3 or is_close_up:
            return color_samples
        
        # Calculate average LAB values
        avg_lab = {
            "L": sum(sample["lab"]["L"] for sample in color_samples) / len(color_samples),
            "a": sum(sample["lab"]["a"] for sample in color_samples) / len(color_samples),
            "b": sum(sample["lab"]["b"] for sample in color_samples) / len(color_samples)
        }
        
        # Calculate distances from average
        distances = []
        for sample in color_samples:
            distance = self.delta_e_2000(sample["lab"], avg_lab)
            distances.append(distance)
        
        # More lenient outlier removal
        sorted_distances = sorted(distances)
        n = len(sorted_distances)
        q1 = sorted_distances[n//4]
        q3 = sorted_distances[3*n//4]
        iqr = q3 - q1
        
        threshold = q3 + 2.0 * iqr  # More lenient threshold
        
        valid_samples = []
        for i, sample in enumerate(color_samples):
            if distances[i] <= threshold:
                valid_samples.append(sample)
        
        # Ensure we have at least 2 samples
        if len(valid_samples) < 2 and len(color_samples) >= 2:
            # Take the 2 closest to average
            sample_distance_pairs = list(zip(color_samples, distances))
            sample_distance_pairs.sort(key=lambda x: x[1])
            valid_samples = [pair[0] for pair in sample_distance_pairs[:2]]
        
        return valid_samples

    def determine_undertone(self, avg_color):
        """Determine skin undertone based on color analysis"""
        r, g, b = avg_color["r"], avg_color["g"], avg_color["b"]
        
        # Convert to HSV for better undertone analysis
        h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
        h = h * 360
        
        # Calculate ratios
        yellow_ratio = (r + g) / (2 * b) if b > 0 else 1
        pink_ratio = (r + b) / (2 * g) if g > 0 else 1
        
        # Hue-based undertone detection
        if h >= 15 and h <= 35 and yellow_ratio > 1.15:
            return "Warm"
        elif (h >= 0 and h <= 15) or (h >= 340 and h <= 360):
            if pink_ratio > 1.1:
                return "Cool"
        elif yellow_ratio > 1.25:
            return "Warm"
        elif pink_ratio > 1.2:
            return "Cool"
        
        return "Neutral"

    def determine_seasonal_type(self, avg_color, undertone):
        """Determine seasonal color type"""
        r, g, b = avg_color["r"], avg_color["g"], avg_color["b"]
        brightness = (r + g + b) / 3
        
        if undertone == "Warm":
            return "Spring" if brightness > 140 else "Autumn"
        elif undertone == "Cool":
            return "Summer" if brightness > 140 else "Winter"
        else:  # Neutral
            return "Summer" if brightness > 140 else "Winter"

    def calculate_average_color(self, color_samples):
        """Calculate average color from samples"""
        avg_color = {
            "r": round(sum(sample["r"] for sample in color_samples) / len(color_samples)),
            "g": round(sum(sample["g"] for sample in color_samples) / len(color_samples)),
            "b": round(sum(sample["b"] for sample in color_samples) / len(color_samples))
        }
        return avg_color

    def classify_brightness(self, avg_color):
        """Classify skin tone brightness level"""
        # Use luminance formula for better brightness assessment
        luminance = 0.299 * avg_color["r"] + 0.587 * avg_color["g"] + 0.114 * avg_color["b"]
        
        if luminance < 80:
            return "Deep"
        elif luminance < 120:
            return "Medium-Deep"
        elif luminance < 160:
            return "Medium"
        elif luminance < 200:
            return "Medium-Light"
        else:
            return "Light"

    def determine_contrast_level(self, seasonal_type):
        """Determine contrast level based on seasonal type"""
        if seasonal_type in ["Spring", "Summer"]:
            return "Low"
        elif seasonal_type in ["Autumn", "Winter"]:
            return "High"
        else:
            return "Medium"

    def get_complementary_colors(self, season):
        """Get complementary colors for the determined season"""
        seasonal_palettes = {
            "Spring": [
                {"color": "#FFDAB9", "name": "Peach", "hex": "#FFDAB9"},
                {"color": "#FFE4B5", "name": "Moccasin", "hex": "#FFE4B5"},
                {"color": "#FA8072", "name": "Salmon", "hex": "#FA8072"},
                {"color": "#F4A460", "name": "Sandy Brown", "hex": "#F4A460"}
            ],
            "Summer": [
                {"color": "#C0C0FF", "name": "Periwinkle", "hex": "#C0C0FF"},
                {"color": "#DDA0DD", "name": "Plum", "hex": "#DDA0DD"},
                {"color": "#B0E0E6", "name": "Powder Blue", "hex": "#B0E0E6"},
                {"color": "#FFC0CB", "name": "Pink", "hex": "#FFC0CB"}
            ],
            "Autumn": [
                {"color": "#8B4513", "name": "Saddle Brown", "hex": "#8B4513"},
                {"color": "#A0522D", "name": "Sienna", "hex": "#A0522D"},
                {"color": "#D2691E", "name": "Chocolate", "hex": "#D2691E"},
                {"color": "#556B2F", "name": "Olive", "hex": "#556B2F"}
            ],
            "Winter": [
                {"color": "#00008B", "name": "Dark Blue", "hex": "#00008B"},
                {"color": "#4682B4", "name": "Steel Blue", "hex": "#4682B4"},
                {"color": "#008B8B", "name": "Teal", "hex": "#008B8B"},
                {"color": "#B0C4DE", "name": "Light Steel Blue", "hex": "#B0C4DE"}
            ]
        }
        
        return seasonal_palettes.get(season, seasonal_palettes["Spring"])

    def get_seasonal_description(self, season):
        """Get description for the seasonal color type"""
        descriptions = {
            "Spring": "Warm and bright colors that enhance your golden undertone.",
            "Summer": "Soft, cool colors that complement your delicate undertone.", 
            "Autumn": "Rich, warm earthy tones that enhance your natural depth.",
            "Winter": "Bold, cool colors that create striking contrast with your skin."
        }
        
        return descriptions.get(season, "Colors that complement your unique skin tone.")

    def create_debug_image(self, image, face_region, sampling_points, valid_samples):
        """
        Create a debug image showing detected face region and sampling points
        """
        debug_img = image.copy()
        
        # Draw face region
        cv2.rectangle(debug_img, 
                     (face_region["x"], face_region["y"]), 
                     (face_region["x"] + face_region["width"], 
                      face_region["y"] + face_region["height"]), 
                     (0, 255, 0), 2)
        
        # Draw sampling points
        for i, point in enumerate(sampling_points):
            x, y = int(point["x"]), int(point["y"])
            # Green for valid samples, red for invalid
            color = (0, 255, 0) if i < len(valid_samples) else (0, 0, 255)
            cv2.circle(debug_img, (x, y), 5, color, -1)
            cv2.putText(debug_img, str(i), (x+10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        return debug_img

    def analyze_face_color(self, image_path, debug=False):
        """
        Main function to analyze facial color with improved close-up handling
        """
        try:
            # Validate input
            if not image_path or not os.path.exists(image_path):
                return {"error": "Image file not found. Please check the file path."}
            
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {"error": "Could not load image. Please check the file format. Supported formats: JPG, PNG, BMP, TIFF."}
            
            # Check if image is valid
            if len(image.shape) != 3 or image.shape[2] != 3:
                return {"error": "Invalid image format. Please provide a color image."}
            
            # Get face region using MediaPipe
            face_region = self.get_face_region_mediapipe(image)
            if face_region is None:
                return {"error": "No face detected in the image. Please ensure the face is clearly visible and well-lit."}
            
            # Lower confidence requirement
            if face_region["confidence"] < 0.3:
                return {"error": f"Face detection confidence too low ({face_region['confidence']:.2f}). Please use a clearer image."}
            
            # Detect if this is a close-up photo
            is_close_up = self.is_close_up_photo(face_region, image.shape)
            
            # Get detailed landmarks
            landmarks = self.get_face_landmarks(image)
            
            # Get adaptive sampling points
            sampling_points = self.get_skin_sampling_points_adaptive(face_region, landmarks, is_close_up)
            
            # Sample colors with adaptive validation
            valid_samples = self.sample_skin_colors_adaptive(image, sampling_points, is_close_up)
            
            # More lenient minimum sample requirement
            min_samples = 1 if is_close_up else 2
            if len(valid_samples) < min_samples:
                return {"error": "Could not find enough valid skin color samples. The image may have poor lighting or the face may be obscured."}
            
            # Remove outliers with adaptive method
            filtered_samples = self.remove_outliers_adaptive(valid_samples, is_close_up)
            
            # Calculate average skin color
            avg_color = self.calculate_average_color(filtered_samples)
            
            # More lenient final validation for close-ups
            if not self.is_skin_color_relaxed(avg_color["r"], avg_color["g"], avg_color["b"], is_close_up):
                return {"error": "Detected color doesn't appear to be skin. Please ensure good lighting and clear face visibility."}
            
            # Determine undertone and seasonal type
            undertone = self.determine_undertone(avg_color)
            seasonal_type = self.determine_seasonal_type(avg_color, undertone)
            brightness = self.classify_brightness(avg_color)
            contrast = self.determine_contrast_level(seasonal_type)
            
            # Get complementary colors
            complementary_colors = self.get_complementary_colors(seasonal_type)
            
            # Create hex color
            hex_color = f"#{avg_color['r']:02x}{avg_color['g']:02x}{avg_color['b']:02x}"
            
            result = {
                "success": True,
                "skintone": {
                    "name": f"{brightness} {undertone}",
                    "color": f"rgb({avg_color['r']}, {avg_color['g']}, {avg_color['b']})",
                    "hex": hex_color,
                    "undertone": undertone,
                    "brightness": brightness,
                    "season": seasonal_type,
                    "contrast": contrast,
                    "rgb": avg_color,
                    "validSamples": len(filtered_samples),
                    "totalSamples": len(sampling_points),
                    "skinValidation": True,
                    "isCloseUp": is_close_up  # New field
                },
                "complementaryColors": complementary_colors,
                "description": self.get_seasonal_description(seasonal_type),
                "analysis_points": len(filtered_samples),
                "face_region": {
                    "x": face_region["x"],
                    "y": face_region["y"], 
                    "width": face_region["width"],
                    "height": face_region["height"],
                    "confidence": face_region.get("confidence", 0.5)
                },
                "samplingPoints": [{"x": int(p["x"]), "y": int(p["y"])} for p in sampling_points],
                "landmarks_used": landmarks is not None and len(landmarks) > 0
            }
            
            # Add debug image if requested
            if debug:
                try:
                    debug_img = self.create_debug_image(image, face_region, sampling_points, filtered_samples)
                    # Save debug image
                    debug_path = image_path.replace('.jpg', '_debug.jpg').replace('.png', '_debug.png')
                    cv2.imwrite(debug_path, debug_img)
                    result["debug_image_path"] = debug_path
                except Exception as debug_error:
                    result["debug_warning"] = f"Could not create debug image: {str(debug_error)}"
            
            return result
            
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}

    def __del__(self):
        """Clean up MediaPipe resources"""
        if hasattr(self, 'face_detection'):
            self.face_detection.close()
        if hasattr(self, 'face_mesh'):
            self.face_mesh.close()


# Usage example function
def analyze_uploaded_image(image_path, debug=False):
    """
    Convenient function to analyze an uploaded image
    
    Args:
        image_path (str): Path to the uploaded image file
        debug (bool): Whether to create debug visualization
        
    Returns:
        dict: Complete color analysis results
    """
    analyzer = FacialColorAnalyzer()
    result = analyzer.analyze_face_color(image_path, debug)
    analyzer.__del__()  # Clean up resources
    return result

# Example usage
if __name__ == "__main__":
    image_path = "path/to/uploaded/selfie.jpg"
    
    try:
        # Run with debug=True to see detection visualization
        analysis_result = analyze_uploaded_image(image_path, debug=True)
        
        if "error" in analysis_result:
            print(f"Error: {analysis_result['error']}")
        else:
            print("Analysis Results:")
            print(f"Skin Tone: {analysis_result['skintone']['name']}")
            print(f"Color: {analysis_result['skintone']['color']}")
            print(f"Hex: {analysis_result['skintone']['hex']}")
            print(f"Undertone: {analysis_result['skintone']['undertone']}")
            print(f"Season: {analysis_result['skintone']['season']}")
            print(f"Face Detection Confidence: {analysis_result['face_region']['confidence']:.2f}")
            print(f"Valid Samples: {analysis_result['skintone']['validSamples']}")
            print(f"Skin Validation Passed: {analysis_result['skintone']['skinValidation']}")
            
    except Exception as e:
        print(f"Unexpected Error: {e}")