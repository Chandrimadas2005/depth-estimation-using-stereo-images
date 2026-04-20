import os
import cv2
import numpy as np
from flask import Flask, render_template, request
from PIL import Image, ExifTags
from flask import send_file
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
import matplotlib.pyplot as plt

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def disparity_to_depth(disparity, focal_px, baseline_m):
    with np.errstate(divide='ignore'):
        depth_cm = (focal_px * baseline_m / disparity) * 100
        depth_cm[disparity <= 0] = np.nan
    return depth_cm

def get_exif_data(img_path):
    img = Image.open(img_path)
    exif_data = img._getexif()
    exif = {}
    if exif_data:
        for tag, value in exif_data.items():
            tag_name = ExifTags.TAGS.get(tag, tag)
            exif[tag_name] = value
    return exif

def get_actual_focal_length(exif):
    focal = exif.get('FocalLength')
    if isinstance(focal, tuple):
        return focal[0] / focal[1]
    return float(focal) if focal else None

def get_camera_model(exif):
    return exif.get('Model', None)

def choose_crop_factor(model):
    if not model: return 5.6
    model = model.lower()
    if "iphone 14 pro" in model: return 2.7
    elif "iphone 13" in model or "iphone 12" in model or "iphone 11" in model: return 5.6
    elif "samsung galaxy s23 ultra" in model: return 2.7
    elif "samsung galaxy s22" in model or "samsung galaxy s21" in model: return 4.0
    elif "xiaomi 13 pro" in model: return 2.7
    elif "google pixel" in model: return 2.8
    elif "redmi note 12 pro" in model: return 3.1
    elif "oneplus 11" in model: return 3.7
    elif "sony xperia 1" in model: return 2.7
    return 5.6

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        left_img = request.files['left_image']
        right_img = request.files['right_image']
        baseline = float(request.form['baseline'])

        left_path = os.path.join(app.config['UPLOAD_FOLDER'], 'left.jpg')
        right_path = os.path.join(app.config['UPLOAD_FOLDER'], 'right.jpg')
        left_img.save(left_path)
        right_img.save(right_path)

        left = cv2.imread(left_path)
        right = cv2.imread(right_path)
        grayL = cv2.cvtColor(left, cv2.COLOR_BGR2GRAY)
        grayR = cv2.cvtColor(right, cv2.COLOR_BGR2GRAY)

        exif = get_exif_data(left_path)
        actual_focal = get_actual_focal_length(exif)
        model = get_camera_model(exif)
        crop_factor = choose_crop_factor(model)
        equivalent_focal = actual_focal * crop_factor
        focal_px = equivalent_focal * 3.77952756

        stereo = cv2.StereoSGBM_create(
            minDisparity=0, numDisparities=64, blockSize=5,
            P1=8 * 3 * 5 ** 2, P2=32 * 3 * 5 ** 2,
            disp12MaxDiff=1, uniquenessRatio=10,
            speckleWindowSize=100, speckleRange=32
        )
        disparity = stereo.compute(grayL, grayR).astype(np.float32) / 16.0
        disparity = cv2.medianBlur(disparity, 5)
        depth_cm = disparity_to_depth(disparity, focal_px, baseline)

        min_d = round(np.nanmin(depth_cm), 2)
        
        stats = {
    'model': model,
    'actual_focal': round(actual_focal, 2),
    'crop_factor': crop_factor,
    'focal_35mm_px': round(focal_px, 2),
    'max_depth': round(np.nanmax(depth_cm), 2),
    'mean_depth': round(np.nanmean(depth_cm), 2),
    'min_depth': min_d
}

# Save heatmap
        plt.imshow(depth_cm, cmap='plasma')
        plt.axis('off')
        plt.savefig(os.path.join(app.config['UPLOAD_FOLDER'], 'heatmap.jpg'), bbox_inches='tight', pad_inches=0)
        plt.close()

        return render_template('index.html', min_depth=min_d, stats=stats)


    return render_template('index.html', min_depth=None)
@app.route('/download-pdf')
def download_pdf():
    stats = {
        'model': request.args.get('model'),
        'actual_focal': request.args.get('actual_focal'),
        'crop_factor': request.args.get('crop_factor'),
        'focal_35mm_px': request.args.get('focal_35mm_px'),
        'max_depth': request.args.get('max_depth'),
        'mean_depth': request.args.get('mean_depth'),
        'min_depth': request.args.get('min_depth'),
    }
    heatmap_path = os.path.join(app.config['UPLOAD_FOLDER'], 'heatmap.jpg')

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    p.setFont("Helvetica", 14)
    p.drawString(50, height - 50, "Stereo Depth Estimation Report")

    y = height - 90
    for key, value in stats.items():
        label = key.replace('_', ' ').title()
        p.drawString(50, y, f"{label}: {value}")
        y -= 25

    if os.path.exists(heatmap_path):
        p.drawImage(heatmap_path, 50, y - 220, width=400, height=200)

    p.showPage()
    p.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="depth_report.pdf", mimetype='application/pdf')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

