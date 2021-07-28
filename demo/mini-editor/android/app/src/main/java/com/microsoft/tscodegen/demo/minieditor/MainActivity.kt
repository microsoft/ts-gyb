package com.microsoft.tscodegen.demo.minieditor

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.microsoft.tscodegen.demo.minieditor.generated.EditorBridge
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStream
import java.io.InputStreamReader
import java.util.*
import kotlin.concurrent.schedule

private const val BUNDLE_FILENAME = "bundle.html"

class MainActivity : AppCompatActivity() {
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView = findViewById<WebView>(R.id.web_view)

        val inputStream = baseContext.assets.open(BUNDLE_FILENAME)
        val htmlString = convertStreamToString(inputStream)!!

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.loadWithOverviewMode = true

        // Adjust from the official example: https://developer.android.com/guide/webapps/webview
        val encodedHtml = Base64.encodeToString(htmlString.toByteArray(), Base64.NO_PADDING)
        webView.loadData(encodedHtml, "text/html", "base64")

        val gson = GsonBuilder().create()
        val bridge = EditorBridge(webView, gson)

        Handler(Looper.getMainLooper()).postDelayed({
            bridge.insertContent("test", true) { result ->

            }
        }, 1500)
    }

    private fun convertStreamToString(inputStream: InputStream): String? {
        val reader = BufferedReader(InputStreamReader(inputStream))
        val stringBuilder = StringBuilder()
        var line: String? = null
        try {
            while (reader.readLine().also { line = it } != null) {
                stringBuilder.append(line).append('\n')
            }
        } catch (e: IOException) {
            e.printStackTrace()
        } finally {
            try {
                inputStream.close()
            } catch (e: IOException) {
                e.printStackTrace()
            }
        }
        return stringBuilder.toString()
    }
}