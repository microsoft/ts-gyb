package com.microsoft.tscodegen.demo.minieditor

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebView

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        var webView = findViewById<WebView>(R.id.web_view)
        webView.loadUrl("https://bing.com")
//        webView.evaluateJavascript("sed");
    }
}