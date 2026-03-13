# CA Final Study Tracker — Android Studio WebView Integration Guide

## Project Structure

```
ca-tracker-pwa/
├── index.html          ← Main app entry point
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (offline support)
├── css/
│   └── style.css       ← All app styles + mobile/PWA additions
├── js/
│   ├── constants.js    ← App constants, default data, all state variables
│   ├── storage.js      ← localStorage load/save, data migration, auto-adjust
│   ├── risk-engine.js  ← Chapter risk scoring and priority algorithms
│   ├── metrics.js      ← Streak tracking, metrics computation
│   ├── helpers.js      ← Auto-schedule, SVG helpers, utility functions
│   ├── ui-dash.js      ← Dashboard + Subject tab renderers
│   ├── timer.js        ← Focus timer with timestamp logic + wake lock
│   ├── planner.js      ← Study planner: wizard, CRUD, render
│   ├── tests.js        ← Test series tracking
│   ├── diary.js        ← Study diary and mistake log
│   ├── strategy.js     ← Exam strategy, blueprint planner, calendar, settings
│   └── app.js          ← Main render loop, all event handlers, init
└── assets/
    └── icons/
        ├── icon-192.png
        └── icon-512.png
```

---

## Step 1 — Copy Files into Android Studio

1. Open Android Studio and create a new **Empty Activity** project.
2. In `app/src/main/`, create a folder named `assets/`.
3. Copy the **entire `ca-tracker-pwa/` folder contents** into:
   ```
   app/src/main/assets/
   ```
   Final structure:
   ```
   app/src/main/assets/
   ├── index.html
   ├── manifest.json
   ├── sw.js
   ├── css/style.css
   ├── js/*.js
   └── assets/icons/*.png
   ```

---

## Step 2 — Configure AndroidManifest.xml

Add internet permission (for fonts/XLSX CDN on first load):
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

Set your activity to use the full screen:
```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:theme="@style/Theme.AppCompat.NoActionBar">
    <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
    </intent-filter>
</activity>
```

---

## Step 3 — Configure MainActivity.java / MainActivity.kt

### Java:
```java
import android.os.Bundle;
import android.webkit.*;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        WebSettings settings = webView.getSettings();

        // Required settings
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);       // enables localStorage
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        // Performance
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);

        // Prevent external navigation
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("file://")) {
                    return false; // allow internal navigation
                }
                return true; // block external navigation
            }
        });

        // Load the app
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

### Kotlin:
```kotlin
import android.os.Bundle
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // enables localStorage
            allowFileAccess = true
            allowContentAccess = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView, request: WebResourceRequest
            ): Boolean {
                return !request.url.toString().startsWith("file://")
            }
        }

        webView.loadUrl("file:///android_asset/index.html")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }
}
```

---

## Step 4 — Configure activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"/>

</RelativeLayout>
```

---

## Step 5 — Enable Hardware Acceleration

In `AndroidManifest.xml` inside `<application>`:
```xml
<application
    android:hardwareAccelerated="true"
    ...>
```

---

## Step 6 — Build & Run

1. Connect Android device or start emulator
2. Click **Run** in Android Studio
3. The app loads from `file:///android_asset/index.html`

---

## Notes on localStorage in WebView

- `domStorageEnabled = true` is **required** — without it localStorage is unavailable
- Data persists as long as the app is installed (same as a native app)
- Data is stored in the app's private storage — not accessible to other apps
- Uninstalling the app clears all saved data (standard Android behavior)

---

## Notes on Service Worker

Service workers do **not** run on `file://` URLs. This is expected and fine:
- The service worker registers but will silently fail for `file://` — no errors
- Offline support via service worker only activates if you serve from HTTPS
- For WebView usage, offline support is built-in (all files are local assets)
- The app is already fully offline when loaded from assets — no SW needed

---

## PWA Installation (Chrome / Browser)

If serving from a web server (HTTPS), users can install the PWA:
1. Open in Chrome on Android
2. Chrome shows "Add to Home Screen" prompt automatically
3. App installs as standalone (no browser chrome)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank white screen | Check `domStorageEnabled = true` |
| Data not persisting | Ensure `databaseEnabled = true` |
| Fonts not loading | Add `INTERNET` permission to manifest |
| Timer stops | Timer uses `Date.now()` timestamps — immune to WebView throttling |
| Back button exits app | Add `onBackPressed` override (see Step 3) |
