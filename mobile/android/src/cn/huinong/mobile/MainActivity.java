package cn.huinong.mobile;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.*;
import java.util.*;

/** Offline distribution of the same mobile build. No JavaScript-to-native bridge. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/index.html#overview";
    private static final int PICK_IMAGE = 101;
    private WebView web;
    private ValueCallback<Uri[]> pendingFiles;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(238,245,252));
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(238,245,252));
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Only user-selected document URIs are supplied to the file chooser.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setGeolocationEnabled(false);
        settings.setSupportMultipleWindows(false);
        settings.setUserAgentString(settings.getUserAgentString()+" HuinongAndroid/1.0");
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();
                if(!HOST.equals(uri.getHost()))return null;
                if(!"https".equals(uri.getScheme())||!uri.getPath().startsWith("/assets/"))return missing();
                String path=uri.getPath().substring(8);
                if(path.contains("..")||path.contains("\\")||path.isEmpty())return missing();
                try{
                    InputStream input=getAssets().open("web/"+path);
                    String mime=mime(path);
                    return new WebResourceResponse(mime,mime.startsWith("text/")||mime.contains("javascript")||mime.contains("json")?"UTF-8":null,200,"OK",Collections.singletonMap("Cache-Control","no-cache"),input);
                }catch(IOException ex){return missing();}
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();
                if("https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&uri.getPath().startsWith("/assets/"))return false;
                if(request.isForMainFrame()&&"https".equals(uri.getScheme())){
                    try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ex){Toast.makeText(MainActivity.this,"未找到可用浏览器",Toast.LENGTH_SHORT).show();}
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(pendingFiles!=null)pendingFiles.onReceiveValue(null);
                pendingFiles=callback;
                Intent choose=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                choose.addCategory(Intent.CATEGORY_OPENABLE);
                choose.setType("image/*");
                choose.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try{startActivityForResult(Intent.createChooser(choose,"选择作业照片"),PICK_IMAGE);}catch(Exception ex){pendingFiles.onReceiveValue(null);pendingFiles=null;Toast.makeText(MainActivity.this,"无法打开图片选择器",Toast.LENGTH_SHORT).show();}
                return true;
            }
        });
        web.loadUrl(HOME);
    }
    private static WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
    private static String mime(String path){
        String ext=path.substring(path.lastIndexOf('.')+1).toLowerCase(Locale.ROOT);
        if(ext.equals("js")||ext.equals("mjs"))return "application/javascript";
        if(ext.equals("svg"))return "image/svg+xml";
        if(ext.equals("json"))return "application/json";
        if(ext.equals("wasm"))return "application/wasm";
        String type=MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
        return type==null?"application/octet-stream":type;
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==PICK_IMAGE&&pendingFiles!=null){pendingFiles.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);pendingFiles=null;}}
    @Override public void onBackPressed(){
        web.evaluateJavascript("(function(){if(document.querySelector('[role=dialog]')){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return true;}return false;})()", handled->{
            if(!"true".equals(handled)){if(web.canGoBack())web.goBack();else MainActivity.super.onBackPressed();}
        });
    }
    @Override protected void onPause(){web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){if(pendingFiles!=null)pendingFiles.onReceiveValue(null);web.destroy();super.onDestroy();}
}
