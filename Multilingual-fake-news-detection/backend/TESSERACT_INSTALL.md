# Tesseract OCR Installation Guide for Windows

## ⚠️ Automated Installation Failed
Both `winget` and `chocolatey` require administrator privileges. Please follow the manual installation steps below:

---

## 📥 Manual Installation Steps

### **Option 1: Download Pre-built Installer (Recommended)**

1. **Download Tesseract Installer:**
   - Visit: https://github.com/UB-Mannheim/tesseract/wiki
   - Click on **"tesseract-ocr-w64-setup-5.x.x.xxxxxxxx.exe"** (latest version)
   - Or direct link: https://digi.bib.uni-mannheim.de/tesseract/

2. **Run the Installer:**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the installation wizard
   - **IMPORTANT:** Note the installation path (default: `C:\Program Files\Tesseract-OCR`)
   - Select **"Additional language data"** during installation
   - Choose: ✅ English, ✅ Hindi, ✅ Kannada (or install all)
   - Click "Install"

3. **Add Tesseract to System PATH:**
   
   **Automatic (Using PowerShell - Run as Administrator):**
   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Tesseract-OCR", "Machine")
   ```
   
   **Manual:**
   - Press `Win + X` → Select "System"
   - Click "Advanced system settings" (right side)
   - Click "Environment Variables" button
   - Under "System variables", find and select "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\Tesseract-OCR`
   - Click "OK" on all windows
   - **Restart your terminal** for changes to take effect

4. **Verify Installation:**
   ```powershell
   # Open NEW PowerShell window
   tesseract --version
   ```
   
   Expected output:
   ```
   tesseract 5.4.0
   leptonica-1.84.1
   ```

---

### **Option 2: Using Chocolatey with Admin Rights**

1. **Open PowerShell as Administrator:**
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Install Chocolatey (if not installed):**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

3. **Install Tesseract:**
   ```powershell
   choco install tesseract -y
   ```

4. **Verify:**
   ```powershell
   tesseract --version
   ```

---

### **Option 3: Using winget with Admin Rights**

1. **Open PowerShell as Administrator**

2. **Install Tesseract:**
   ```powershell
   winget install --id UB-Mannheim.TesseractOCR -e --accept-source-agreements --accept-package-agreements
   ```

3. **Verify:**
   ```powershell
   tesseract --version
   ```

---

## 🔧 Configure Backend to Use Tesseract

### **If Tesseract is NOT in PATH:**

Update `backend/services/ocr_service.py` to specify the path manually:

```python
import pytesseract

# Add this line after imports
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

Replace `C:\Program Files\Tesseract-OCR\tesseract.exe` with your actual installation path.

---

## 📦 Install Additional Language Data (Optional)

If you didn't select languages during installation:

1. Download language data files from:
   https://github.com/tesseract-ocr/tessdata

2. Download these files:
   - `eng.traineddata` (English)
   - `hin.traineddata` (Hindi)
   - `kan.traineddata` (Kannada)

3. Copy them to:
   `C:\Program Files\Tesseract-OCR\tessdata\`

---

## ✅ Test Tesseract

### **Test from Command Line:**
```powershell
# Create a test image with text
tesseract --list-langs
```

Expected output should include:
```
eng
hin
kan
```

### **Test in Python:**
```python
import pytesseract
from PIL import Image

# Test if Tesseract is accessible
print(pytesseract.get_tesseract_version())
```

---

## 🚀 After Installation

1. **Restart your terminal/VS Code**
2. **Restart the Flask backend:**
   ```powershell
   cd backend
   python app.py
   ```

3. **Check for success:**
   - You should NOT see the warning:
     `WARNING:services.ocr_service:Tesseract OCR not available`
   
4. **Test image analysis:**
   - Go to `http://localhost:5173/verify-image`
   - Upload an image with text
   - Click "Analyze with OCR"
   - Should extract and analyze text!

---

## 🐛 Troubleshooting

### **Error: "tesseract is not recognized"**
**Solution:** Tesseract is not in PATH. Add it manually or specify path in `ocr_service.py`

### **Error: "Failed to load language data"**
**Solution:** Language files missing. Download from tessdata repo and copy to `tessdata` folder

### **Error: "Permission denied"**
**Solution:** Run installer as Administrator

### **Backend still shows warning**
**Solution:** 
1. Restart terminal
2. Restart Flask server
3. Check Path with: `$env:Path`

---

## 📊 Expected File Structure After Installation

```
C:\Program Files\Tesseract-OCR\
├── tesseract.exe           ← Main executable
├── tessdata\
│   ├── eng.traineddata     ← English language data
│   ├── hin.traineddata     ← Hindi language data
│   ├── kan.traineddata     ← Kannada language data
│   └── ...other langs
└── ...other DLLs
```

---

## ℹ️ About Tesseract

- **What it does:** Extracts text from images (OCR - Optical Character Recognition)
- **Use case:** Analyze screenshots, social media posts, WhatsApp forwards with fake news
- **Languages:** Supports 100+ languages including English, Hindi, Kannada
- **Performance:** Processes typical image in 2-5 seconds
- **Accuracy:** 90-95% for clear text, lower for handwritten or low-quality images

---

## 🎯 Quick Start After Installation

```powershell
# 1. Verify installation
tesseract --version

# 2. Check languages available
tesseract --list-langs

# 3. Restart backend
cd "C:\Users\prave\Desktop\fake new\backend"
python app.py

# 4. Test image verification
# Navigate to http://localhost:5173/verify-image
```

---

**Need help?** Check:
- Official docs: https://tesseract-ocr.github.io/
- UB-Mannheim builds: https://github.com/UB-Mannheim/tesseract/wiki
- Language data: https://github.com/tesseract-ocr/tessdata
