package cn.huinong.mobile;

import android.app.Activity;
import android.app.AlertDialog;
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
import android.os.SystemClock;
import android.util.Base64;
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
import org.json.JSONObject;
import org.json.JSONTokener;

/** Offline distribution. Native actions are scoped to our bundled top-level page. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/index.html#overview";
    private static final int PICK_IMAGE = 101;
    private static final int SAVE_REPORT = 102;
    private static final String VERSION = "1.1.1";
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
    private boolean inForeground;
    private int foregroundEpoch;
    private String lastRoute = "overview";
    private File pendingReport;
    private boolean preparingReport;
    private boolean writingReport;
    private long startedAt;
    private long firstFrameMs;
    private String pageTiming = "尚未就绪";
    private final Runnable startupCheck = () -> checkStartup(launchId);

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        if(saved!=null){
            lastRoute=validRoute(saved.getString("route","overview"));
            if(saved.getBoolean("reportPending",false)){
                File candidate=new File(getCacheDir(),"pending-report.bin");
                if(candidate.isFile())pendingReport=candidate;
            }
        }
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
        ++launchId;
        handler.removeCallbacksAndMessages(null);
        disposeWeb();
        root.removeAllViews();
        lastError = "";
        startedAt=SystemClock.elapsedRealtime();firstFrameMs=0;pageTiming="尚未就绪";
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
        settings.setUserAgentString(settings.getUserAgentString()+" HuinongAndroid/"+VERSION);
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
                if("huinong".equals(uri.getScheme())){
                    if(request.isForMainFrame()&&view==web&&trustedPage(view.getUrl())){
                        if("save-report".equals(uri.getHost()))prepareReport();
                        else if("diagnostics".equals(uri.getHost()))showDiagnostics();
                    }
                    return true;
                }
                if("https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/assets/"))return false;
                if(request.isForMainFrame()&&"https".equals(uri.getScheme())){
                    try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ex){Toast.makeText(MainActivity.this,"未找到可用浏览器",Toast.LENGTH_SHORT).show();}
                }
                return true;
            }
            @Override public void doUpdateVisitedHistory(WebView view,String url,boolean reload){
                if(trustedPage(url))lastRoute=validRoute(Uri.parse(url).getFragment());
            }
            @Override public void onPageCommitVisible(WebView view,String url){
                if(view==web&&firstFrameMs==0)firstFrameMs=SystemClock.elapsedRealtime()-startedAt;
            }
            @Override public void onPageFinished(WebView view,String url){
                if(view==web&&trustedPage(url))captureTiming(view,0);
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
        web.loadUrl(HOME.substring(0,HOME.indexOf('#'))+"#"+lastRoute);
        handler.postDelayed(startupCheck,30000);
        } catch (RuntimeException | LinkageError error) {
            Log.e(TAG,"Unable to start WebView",error);
            showFailure("页面内核启动失败："+error.getClass().getSimpleName());
        }
    }

    private void checkStartup(int thisLaunch) {
        if(thisLaunch!=launchId||web==null||isFinishing()||!inForeground)return;
        // Bundled reference/credit documents are static HTML, not the React app.
        // They intentionally do not expose the application's readiness flag.
        if(web.getUrl()!=null&&!trustedPage(web.getUrl()))return;
        final int thisForeground = foregroundEpoch;
        final WebView current=web;
        final Runnable unresponsive=()->{if(current==web&&thisLaunch==launchId&&thisForeground==foregroundEpoch&&inForeground)showFailure("页面内核没有响应，请使用兼容模式重试。");};
        handler.postDelayed(unresponsive,5000);
        current.evaluateJavascript("Boolean(window.__HUINONG_READY__ || window.__HUINONG_BOOT_FAILED__)",result->{
            handler.removeCallbacks(unresponsive);
            if(current==web&&thisLaunch==launchId&&thisForeground==foregroundEpoch&&inForeground&&!"true".equals(result))showFailure(lastError.isEmpty()?"页面启动超时":lastError);
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
        final String diagnosis=diagnosis()+"\n"+reason;
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
        if(pendingReport==null&&!writingReport)preparingReport=false;
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
    private static boolean trustedPage(String url){
        if(url==null)return false;
        Uri uri=Uri.parse(url);
        return "https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&"/assets/index.html".equals(uri.getPath());
    }
    private static String validRoute(String route){
        return route!=null&&Arrays.asList("overview","irrigation","alerts","identify","patrol","team","prediction","spray","fields","tasks","history","demo","notifications","reports").contains(route)?route:"overview";
    }
    private void captureTiming(WebView current,int attempt){
        if(current!=web||!inForeground)return;
        current.evaluateJavascript("window.__HUINONG_READY__ ? JSON.stringify(window.__HUINONG_METRICS__ || {}) : null",value->{
            if(current!=web)return;
            if(!"null".equals(value)){
                try{pageTiming=String.valueOf(new JSONTokener(value).nextValue());}catch(Exception ignored){pageTiming="已就绪";}
                reportFullyDrawn();
                Log.i(TAG,"Ready: firstFrameMs="+firstFrameMs+", web="+pageTiming);
            }else if(attempt<40)handler.postDelayed(()->captureTiming(current,attempt+1),500);
        });
    }
    private String diagnosis(){return "惠农 "+VERSION+"\n"+Build.MANUFACTURER+" "+Build.MODEL+" / Android "+Build.VERSION.RELEASE+"\nWebView: "+engineVersion+"\n原生首帧: "+firstFrameMs+" ms\n页面启动: "+pageTiming+"\n绘制模式: "+(getPreferences(MODE_PRIVATE).getBoolean("softwareRendering",false)?"兼容":"标准");}
    private void showDiagnostics(){
        new AlertDialog.Builder(this).setTitle("应用诊断").setMessage(diagnosis())
            .setPositiveButton("复制信息",(dialog,which)->{ClipboardManager c=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);if(c!=null)c.setPrimaryClip(ClipData.newPlainText("惠农诊断",diagnosis()));})
            .setNeutralButton("下次使用"+(getPreferences(MODE_PRIVATE).getBoolean("softwareRendering",false)?"标准":"兼容")+"模式",(dialog,which)->{
                boolean software=getPreferences(MODE_PRIVATE).getBoolean("softwareRendering",false);
                getPreferences(MODE_PRIVATE).edit().putBoolean("softwareRendering",!software).apply();
                Toast.makeText(this,"下次重新启动时生效",Toast.LENGTH_SHORT).show();
            }).setNegativeButton("关闭",null).show();
    }
    private void exportResult(String status,String message){
        preparingReport=false;
        if(web!=null&&trustedPage(web.getUrl()))web.evaluateJavascript("window.dispatchEvent(new CustomEvent('huinong:export-result',{detail:{status:"+JSONObject.quote(status)+",message:"+JSONObject.quote(message)+"}}));",null);
        if(!"cancelled".equals(status))Toast.makeText(this,message,Toast.LENGTH_LONG).show();
    }
    private void prepareReport(){
        if(preparingReport||pendingReport!=null){Toast.makeText(this,"已有报告正在保存，请先完成或取消。",Toast.LENGTH_SHORT).show();return;}
        preparingReport=true;
        final WebView current=web;
        current.evaluateJavascript("(function(){var r=window.__huinongExport;return r?JSON.stringify({filename:r.filename,mime:r.mime,length:r.data.length}):null;})()",raw->{
            if(current!=web)return;
            try{
                JSONObject info=new JSONObject((String)new JSONTokener(raw).nextValue());
                String mime=info.getString("mime"),name=info.getString("filename");int length=info.getInt("length");
                if(current!=web||!trustedPage(current.getUrl())||!("image/png".equals(mime)||"application/pdf".equals(mime))||length<=0||length>16*1024*1024)throw new IOException("Invalid report");
                name=name.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]","_");
                final String filename=name.substring(0,Math.min(120,name.length()));
                readReportChunk(current,new StringBuilder(length),length,mime,filename);
            }catch(Exception ex){exportResult("error","报告尚未准备好，请重新导出。");}
        });
    }
    private void readReportChunk(WebView current,StringBuilder data,int total,String mime,String filename){
        if(current!=web)return;
        if(!trustedPage(current.getUrl())){exportResult("error","页面已变化，请重新导出。");return;}
        int start=data.length(),end=Math.min(total,start+65536);
        current.evaluateJavascript("window.__huinongExport ? window.__huinongExport.data.slice("+start+","+end+") : null",raw->{
            if(current!=web)return;
            try{
                Object chunk=new JSONTokener(raw).nextValue();
                if(!(chunk instanceof String)||((String)chunk).length()!=end-start)throw new IOException("Incomplete report");
                data.append((String)chunk);
                if(data.length()<total){readReportChunk(current,data,total,mime,filename);return;}
                final byte[] bytes=Base64.decode(data.toString(),Base64.DEFAULT);
                if(bytes.length<8||("application/pdf".equals(mime)?!(bytes[0]=='%'&&bytes[1]=='P'&&bytes[2]=='D'&&bytes[3]=='F'):!(bytes[0]==(byte)137&&bytes[1]=='P'&&bytes[2]=='N'&&bytes[3]=='G')))throw new IOException("Invalid signature");
                // Keep the prepared file in private cache across the system picker.
                pendingReport=new File(getCacheDir(),"pending-report.bin");
                try(FileOutputStream output=new FileOutputStream(pendingReport)){output.write(bytes);}
                Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT);save.addCategory(Intent.CATEGORY_OPENABLE);save.setType(mime);save.putExtra(Intent.EXTRA_TITLE,filename);
                startActivityForResult(save,SAVE_REPORT);
            }catch(Exception ex){if(pendingReport!=null){pendingReport.delete();pendingReport=null;}exportResult("error","无法保存报告，请重试或使用网页版。");}
        });
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==PICK_IMAGE&&pendingFiles!=null){pendingFiles.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);pendingFiles=null;}
        if(request==SAVE_REPORT){
            final File file=pendingReport;pendingReport=null;
            if(file==null){exportResult("error","报告缓存已失效，请重新导出。");return;}
            if(result!=RESULT_OK||data==null||data.getData()==null){file.delete();exportResult("cancelled","");return;}
            final Uri destination=data.getData();
            writingReport=true;
            new Thread(()->{
                String status="saved",message="报告已保存到所选位置";
                try(InputStream input=new FileInputStream(file);OutputStream output=getContentResolver().openOutputStream(destination,"w")){
                    if(output==null)throw new IOException("No output stream");
                    byte[] buffer=new byte[16384];int count;while((count=input.read(buffer))!=-1)output.write(buffer,0,count);output.flush();
                }catch(Exception ex){status="error";message="保存失败，请选择其他位置重试。";}finally{file.delete();}
                final String outcome=status,detail=message;
                runOnUiThread(()->{writingReport=false;exportResult(outcome,detail);});
            },"HuinongReportSave").start();
        }
    }
    @Override public void onBackPressed(){
        if(web==null){super.onBackPressed();return;}
        final WebView current=web;
        current.evaluateJavascript("(function(){if(document.querySelector('[role=dialog]')){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return true;}return false;})()", handled->{
            if(current==web&&!"true".equals(handled)){
                if(!"overview".equals(lastRoute)){
                    if(current.canGoBack())current.goBack();else current.loadUrl(HOME);
                }else moveTaskToBack(true);
            }
        });
    }
    @Override protected void onPause(){inForeground=false;++foregroundEpoch;handler.removeCallbacks(startupCheck);if(web!=null){web.evaluateJavascript("window.__HUINONG_FOREGROUND__=false;document.dispatchEvent(new Event('visibilitychange'));",null);web.onPause();}super.onPause();}
    @Override protected void onResume(){super.onResume();inForeground=true;++foregroundEpoch;if(web!=null){web.onResume();web.evaluateJavascript("window.__HUINONG_FOREGROUND__=true;document.dispatchEvent(new Event('visibilitychange'));",null);handler.removeCallbacks(startupCheck);handler.postDelayed(startupCheck,30000);captureTiming(web,0);}}
    @Override protected void onSaveInstanceState(Bundle saved){saved.putString("route",lastRoute);saved.putBoolean("reportPending",pendingReport!=null);super.onSaveInstanceState(saved);}
    @Override protected void onDestroy(){++launchId;handler.removeCallbacksAndMessages(null);disposeWeb();super.onDestroy();}
}
