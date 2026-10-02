package cn.huinong.mobile;

import android.app.Activity;
import android.content.Intent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.widget.Toast;
import java.io.*;
import java.util.*;

/** Offline distribution of the same mobile build. No JavaScript-to-native bridge. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/index.html#overview";
    private static final int PICK_IMAGE = 101;
    private static final String ONLINE = "https://ch345676.github.io/digital-agri/m/#overview";
    private static final String TAG = "HuinongStartup";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private FrameLayout root;
    private WebView web;
    private int launchId;
    private String lastError = "";
    private String engineVersion = "不可用";
    private boolean triedRendererRecovery;
    private ValueCallback<Uri[]> pendingFiles;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(238,245,252));
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(root);
        startWeb();
    }

    private void startWeb() {
        final int thisLaunch = ++launchId;
        handler.removeCallbacksAndMessages(null);
        disposeWeb();
        root.removeAllViews();
        lastError = "";
        TextView loading = new TextView(this);
        loading.setText("惠农 · 智慧农场\n\n正在打开农场…");
        loading.setTextColor(Color.rgb(36,60,49));
        loading.setTextSize(20);
        loading.setGravity(Gravity.CENTER);
        root.addView(loading,new FrameLayout.LayoutParams(-1,-1));
        // Check through Android's AssetManager before opening a virtual URL.
        // A Windows ZIP extractor treats '\\' as a separator; Android does not.
        try (InputStream entry=getAssets().open("web/index.html")) {
            if(entry.read()<0)throw new IOException("index.html is empty");
        } catch (IOException error) {
            showFailure("安装包缺少本地页面 web/index.html，请下载最新版覆盖安装。");
            return;
        }
        try {
        PackageInfo engine = WebView.getCurrentWebViewPackage();
        engineVersion = engine == null ? "未安装可用内核" : engine.packageName + " " + engine.versionName;
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(238,245,252));
        if (getPreferences(MODE_PRIVATE).getBoolean("softwareRendering",false)) web.setLayerType(View.LAYER_TYPE_SOFTWARE,null);
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Only user-selected document URIs are supplied to the file chooser.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setGeolocationEnabled(false);
        settings.setSupportMultipleWindows(false);
        settings.setUserAgentString(settings.getUserAgentString()+" HuinongAndroid/1.0.2");
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();
                if(!HOST.equals(uri.getHost()))return null;
                if(!"https".equals(uri.getScheme())||uri.getPath()==null||!uri.getPath().startsWith("/assets/"))return missing();
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
                if("https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/assets/"))return false;
                if(request.isForMainFrame()&&"https".equals(uri.getScheme())){
                    try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ex){Toast.makeText(MainActivity.this,"未找到可用浏览器",Toast.LENGTH_SHORT).show();}
                }
                return true;
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){
                if(request.isForMainFrame()&&view==web) showFailure("页面加载失败（"+error.getErrorCode()+"）");
            }
            @Override public void onReceivedHttpError(WebView view,WebResourceRequest request,WebResourceResponse response){
                if(request.isForMainFrame()&&view==web)showFailure("本地页面返回 HTTP "+response.getStatusCode()+"，请下载最新版覆盖安装。");
            }
            @Override public boolean onRenderProcessGone(WebView view,RenderProcessGoneDetail detail){
                if(view!=web)return true;
                disposeWeb();
                if(!triedRendererRecovery){
                    triedRendererRecovery=true;
                    getPreferences(MODE_PRIVATE).edit().putBoolean("softwareRendering",true).apply();
                    handler.post(()->startWeb());
                }else showFailure("页面显示进程已停止，请重试或打开网页版。");
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onConsoleMessage(ConsoleMessage message){
                if(message.messageLevel()==ConsoleMessage.MessageLevel.ERROR){
                    lastError=message.message().substring(0,Math.min(300,message.message().length()));
                    Log.e(TAG,lastError);
                }
                return false;
            }
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
        handler.postDelayed(()->checkStartup(thisLaunch),30000);
        } catch (RuntimeException | LinkageError error) {
            Log.e(TAG,"Unable to start WebView",error);
            showFailure("页面内核启动失败："+error.getClass().getSimpleName());
        }
    }

    private void checkStartup(int thisLaunch) {
        if(thisLaunch!=launchId||web==null||isFinishing())return;
        final WebView current=web;
        final Runnable unresponsive=()->{if(current==web&&thisLaunch==launchId)showFailure("页面内核没有响应，请使用兼容模式重试。");};
        handler.postDelayed(unresponsive,5000);
        current.evaluateJavascript("Boolean(window.__HUINONG_READY__ || window.__HUINONG_BOOT_FAILED__)",result->{
            handler.removeCallbacks(unresponsive);
            if(current==web&&thisLaunch==launchId&&!"true".equals(result))showFailure(lastError.isEmpty()?"页面启动超时":lastError);
        });
    }

    private void showFailure(String reason) {
        ++launchId;
        handler.removeCallbacksAndMessages(null);
        root.removeAllViews();
        disposeWeb();
        LinearLayout panel=new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER_VERTICAL);
        int padding=(int)(28*getResources().getDisplayMetrics().density);
        panel.setPadding(padding,padding,padding,padding);
        TextView title=new TextView(this);
        title.setText("暂时无法打开农场");title.setTextSize(24);title.setTypeface(null,Typeface.BOLD);title.setTextColor(Color.rgb(36,60,49));
        panel.addView(title);
        TextView message=new TextView(this);
        message.setText("\n可以重新打开或使用兼容模式。已有的本地记录会保留。\n");message.setTextSize(15);
        panel.addView(message);
        addButton(panel,"重新打开",()->startWeb());
        addButton(panel,"兼容模式重试",()->{getPreferences(MODE_PRIVATE).edit().putBoolean("softwareRendering",true).apply();startWeb();});
        addButton(panel,"打开网页版",()->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(ONLINE)));}catch(RuntimeException error){Toast.makeText(this,"未找到可用浏览器",Toast.LENGTH_LONG).show();}});
        final String diagnosis="惠农 1.0.2\n"+Build.MANUFACTURER+" "+Build.MODEL+" / Android "+Build.VERSION.RELEASE+"\nWebView: "+engineVersion+"\n"+reason;
        addButton(panel,"复制诊断信息",()->{
            ClipboardManager clipboard=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
            if(clipboard!=null)clipboard.setPrimaryClip(ClipData.newPlainText("惠农启动诊断",diagnosis));
            Toast.makeText(this,"诊断信息已复制",Toast.LENGTH_SHORT).show();
        });
        TextView detail=new TextView(this);detail.setText("\n"+diagnosis);detail.setTextSize(11);detail.setTextIsSelectable(true);panel.addView(detail);
        android.widget.ScrollView scroll=new android.widget.ScrollView(this);scroll.setFillViewport(true);scroll.addView(panel);
        root.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
    }
    private void addButton(LinearLayout panel,String label,Runnable action){Button button=new Button(this);button.setText(label);button.setAllCaps(false);button.setOnClickListener(v->action.run());panel.addView(button,new LinearLayout.LayoutParams(-1,-2));}
    private void disposeWeb(){
        if(pendingFiles!=null){pendingFiles.onReceiveValue(null);pendingFiles=null;}
        if(web!=null){WebView old=web;web=null;root.removeView(old);old.destroy();}
    }
    private static WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
    private static String mime(String path){
        String ext=path.substring(path.lastIndexOf('.')+1).toLowerCase(Locale.ROOT);
        if(ext.equals("html"))return "text/html";
        if(ext.equals("css"))return "text/css";
        if(ext.equals("js")||ext.equals("mjs"))return "application/javascript";
        if(ext.equals("svg"))return "image/svg+xml";
        if(ext.equals("json"))return "application/json";
        if(ext.equals("wasm"))return "application/wasm";
        String type=MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
        return type==null?"application/octet-stream":type;
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==PICK_IMAGE&&pendingFiles!=null){pendingFiles.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);pendingFiles=null;}}
    @Override public void onBackPressed(){
        if(web==null){super.onBackPressed();return;}
        final WebView current=web;
        current.evaluateJavascript("(function(){if(document.querySelector('[role=dialog]')){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return true;}return false;})()", handled->{
            if(current==web&&!"true".equals(handled)){if(current.canGoBack())current.goBack();else MainActivity.super.onBackPressed();}
        });
    }
    @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){++launchId;handler.removeCallbacksAndMessages(null);disposeWeb();super.onDestroy();}
}
