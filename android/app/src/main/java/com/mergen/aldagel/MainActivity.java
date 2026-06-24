package com.mergen.aldagel;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;
    private boolean geolocationBridgeReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestLocationPermissionIfNeeded();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupGeolocationBridge();
    }

    private void requestLocationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{
                                Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION
                        },
                        LOCATION_PERMISSION_REQUEST_CODE
                );
            }
        }
    }

    private void setupGeolocationBridge() {
        if (geolocationBridgeReady) {
            return;
        }

        try {
            Bridge bridge = getBridge();
            if (bridge == null) {
                return;
            }

            WebView webView = bridge.getWebView();
            if (webView == null) {
                return;
            }

            webView.getSettings().setGeolocationEnabled(true);

            // Capacitor'un kendi WebChromeClient'ını koru — düz WebChromeClient kullanmak
            // bridge'i kırar ve uygulama yükleme ekranında takılı kalır.
            BridgeWebChromeClient capClient = new BridgeWebChromeClient(bridge) {
                @Override
                public void onGeolocationPermissionsShowPrompt(
                        String origin,
                        GeolocationPermissions.Callback callback) {
                    if (ContextCompat.checkSelfPermission(MainActivity.this,
                            Manifest.permission.ACCESS_FINE_LOCATION)
                            == PackageManager.PERMISSION_GRANTED) {
                        callback.invoke(origin, true, false);
                    } else {
                        callback.invoke(origin, false, false);
                        requestLocationPermissionIfNeeded();
                    }
                }
            };
            webView.setWebChromeClient(capClient);
            geolocationBridgeReady = true;
        } catch (Exception ignored) {
            // Bridge henüz hazır değilse sonraki onResume'da tekrar dene
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                geolocationBridgeReady = false;
                setupGeolocationBridge();
            }
        }
    }
}
