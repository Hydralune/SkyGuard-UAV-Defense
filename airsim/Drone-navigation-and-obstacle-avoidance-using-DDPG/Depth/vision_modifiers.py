import numpy as np
import cv2 # Added for median filter

def add_gaussian_noise_to_depth(depth_image, mean=0, std=0.1):
    """
    Adds Gaussian noise to a depth image.
    Since depth values are floats, the noise is also float.

    Args:
        depth_image (numpy.ndarray): The input single-channel depth image.
        mean (float, optional): The mean of the Gaussian noise. Defaults to 0.
        std (float, optional): The standard deviation of the Gaussian noise. 
                               This value should be tuned based on the scale of depth values. 
                               Defaults to 0.1.

    Returns:
        numpy.ndarray: The depth image with added Gaussian noise.
    """
    noise = np.random.normal(mean, std, depth_image.shape)
    noisy_image = depth_image + noise
    # We don't clip to 0-255 here, as depth images have a different range.
    # Clipping might be necessary depending on the expected range of depth values.
    return np.clip(noisy_image, 0, None) # Clip at 0 to avoid negative depth 

def apply_median_filter_to_depth(depth_image, kernel_size=5):
    """
    Applies a median filter to a depth image to reduce noise.

    Args:
        depth_image (numpy.ndarray): The input single-channel depth image (float).
        kernel_size (int, optional): The size of the median filter kernel. Must be an odd number. 
                                     Defaults to 5.

    Returns:
        numpy.ndarray: The filtered depth image (float).
    """
    # Median filter in OpenCV works on uint8 images.
    # We need to normalize, apply the filter, and then scale back.
    max_val = np.max(depth_image)
    if max_val == 0:
        return depth_image # Avoid division by zero for all-black images

    # Normalize to 0-255 and convert to uint8
    normalized_image = (depth_image / max_val * 255).astype(np.uint8)
    
    # Apply median blur
    blurred_image = cv2.medianBlur(normalized_image, kernel_size)
    
    # Scale back to original depth range
    filtered_depth_image = (blurred_image.astype(np.float32) / 255) * max_val
    
    return filtered_depth_image 