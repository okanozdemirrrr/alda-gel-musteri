package com.mergen.aldagel;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ═══ 1. Runtime Permission — "Alda-Gel konumunuza erişmek istiyor" pop-up'ı ═══
        requestLocationPermissionIfNeeded();
    }

    @Override
    public void onResume() {
        super.onResume();

        // ═══ 2. WebChromeClient Köprüsü — WebView'dan gelen konum isteğini Android'e bağla ═══
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
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.getSettings().setGeolocationEnabled(true);
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onGeolocationPermissionsShowPrompt(
                            String origin,
                            GeolocationPermissions.Callback callback) {
                        // Kullanıcı Android seviyesinde zaten izin verdiyse, WebView'a da geçir
                        if (ContextCompat.checkSelfPermission(MainActivity.this,
                                Manifest.permission.ACCESS_FINE_LOCATION)
                                == PackageManager.PERMISSION_GRANTED) {
                            callback.invoke(origin, true, false);
                        } else {
                            // İzin henüz verilmemişse tekrar iste, sonra reddet
                            callback.invoke(origin, false, false);
                            requestLocationPermissionIfNeeded();
                        }
                    }
                });
            }
        } catch (Exception e) {
            // Capacitor bridge henüz hazır değilse sessizce devam et
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // İzin verildi — WebView köprüsünü yeniden kur
                setupGeolocationBridge();
            }
        }
    }
}
