.class public final Lcom/dominus/aetherionreforgey/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"


# instance fields
.field private gameView:Landroid/webkit/WebView;

.field private voiceBridge:Lcom/dominus/aetherionreforgey/AetherionVoiceBridge;


# direct methods
.method public constructor <init>()V
    .locals 0

    .line 13
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    return-void
.end method


# virtual methods
.method public onBackPressed()V
    .locals 1

    .line 48
    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z

    move-result v0

    if-eqz v0, :cond_0

    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V

    goto :goto_0

    .line 49
    :cond_0
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V

    .line 50
    :goto_0
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 3

    .line 19
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    .line 20
    invoke-virtual {p0}, Lcom/dominus/aetherionreforgey/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object p1

    const/high16 v0, -0x1000000

    invoke-virtual {p1, v0}, Landroid/view/Window;->setStatusBarColor(I)V

    .line 21
    invoke-virtual {p0}, Lcom/dominus/aetherionreforgey/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object p1

    invoke-virtual {p1, v0}, Landroid/view/Window;->setNavigationBarColor(I)V

    .line 22
    invoke-virtual {p0}, Lcom/dominus/aetherionreforgey/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object p1

    invoke-virtual {p1}, Landroid/view/Window;->getDecorView()Landroid/view/View;

    move-result-object p1

    const/16 v0, 0x500

    invoke-virtual {p1, v0}, Landroid/view/View;->setSystemUiVisibility(I)V

    .line 25
    new-instance p1, Landroid/webkit/WebView;

    invoke-direct {p1, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V

    iput-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    .line 26
    iget-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    const/16 v0, 0x8

    const/4 v1, 0x6

    invoke-static {v0, v1, v0}, Landroid/graphics/Color;->rgb(III)I

    move-result v0

    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->setBackgroundColor(I)V

    .line 27
    iget-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    invoke-virtual {p1}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;

    move-result-object p1

    .line 28
    const/4 v0, 0x1

    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V

    .line 29
    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V

    .line 30
    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V

    .line 31
    const/4 v1, 0x0

    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V

    .line 32
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V

    .line 33
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setAllowContentAccess(Z)V

    .line 34
    const/4 v2, -0x1

    invoke-virtual {p1, v2}, Landroid/webkit/WebSettings;->setCacheMode(I)V

    .line 35
    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setLoadsImagesAutomatically(Z)V

    .line 36
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setBlockNetworkImage(Z)V

    .line 37
    iget-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    const/4 v1, 0x0

    invoke-virtual {p1, v2, v1}, Landroid/webkit/WebView;->setLayerType(ILandroid/graphics/Paint;)V

    .line 38
    nop

    nop

    nop

    .line 39
    iget-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    new-instance v0, Landroid/webkit/WebChromeClient;

    invoke-direct {v0}, Landroid/webkit/WebChromeClient;-><init>()V

    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    .line 40
    iget-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    new-instance v0, Lcom/dominus/aetherionreforgey/AetherionAssetClient;

    invoke-direct {v0, p0}, Lcom/dominus/aetherionreforgey/AetherionAssetClient;-><init>(Landroid/content/Context;)V

    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    .line 41
    new-instance p1, Lcom/dominus/aetherionreforgey/AetherionVoiceBridge;

    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    invoke-direct {p1, p0, v0}, Lcom/dominus/aetherionreforgey/AetherionVoiceBridge;-><init>(Landroid/app/Activity;Landroid/webkit/WebView;)V

    iput-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->voiceBridge:Lcom/dominus/aetherionreforgey/AetherionVoiceBridge;

    .line 42
    iget-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->voiceBridge:Lcom/dominus/aetherionreforgey/AetherionVoiceBridge;

    const-string v1, "AetherionVoice"

    invoke-virtual {p1, v0, v1}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    .line 43
    iget-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    invoke-virtual {p0, p1}, Lcom/dominus/aetherionreforgey/MainActivity;->setContentView(Landroid/view/View;)V

    .line 44
    iget-object p1, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    const-string v0, "https://appassets.androidplatform.net/assets/game/index.html"

    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    .line 45
    return-void
.end method

.method protected onDestroy()V
    .locals 1

    .line 58
    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->voiceBridge:Lcom/dominus/aetherionreforgey/AetherionVoiceBridge;

    if-eqz v0, :cond_0

    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->voiceBridge:Lcom/dominus/aetherionreforgey/AetherionVoiceBridge;

    invoke-virtual {v0}, Lcom/dominus/aetherionreforgey/AetherionVoiceBridge;->shutdown()V

    .line 59
    :cond_0
    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    if-eqz v0, :cond_1

    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->destroy()V

    .line 60
    :cond_1
    invoke-super {p0}, Landroid/app/Activity;->onDestroy()V

    .line 61
    return-void
.end method

.method protected onPause()V
    .locals 3

    .line 53
    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    iget-object v0, p0, Lcom/dominus/aetherionreforgey/MainActivity;->gameView:Landroid/webkit/WebView;

    const-string v1, "window.aetherionFlushSave&&window.aetherionFlushSave()"

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    .line 54
    :cond_0
    invoke-super {p0}, Landroid/app/Activity;->onPause()V

    .line 55
    return-void
.end method
