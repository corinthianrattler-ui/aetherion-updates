.class public final Lcom/dominus/aetherionreforgey/AetherionAssetClient;
.super Landroid/webkit/WebViewClient;
.source "AetherionAssetClient.java"


# instance fields
.field private final assets:Landroid/content/res/AssetManager;


# direct methods
.method public constructor <init>(Landroid/content/Context;)V
    .locals 1

    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V

    invoke-virtual {p1}, Landroid/content/Context;->getAssets()Landroid/content/res/AssetManager;

    move-result-object v0

    iput-object v0, p0, Lcom/dominus/aetherionreforgey/AetherionAssetClient;->assets:Landroid/content/res/AssetManager;

    return-void
.end method

.method private openAsset(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;
    .locals 8

    const/4 v0, 0x0

    if-eqz p1, :return_null

    const-string v1, "https://appassets.androidplatform.net/assets/"

    invoke-virtual {p1, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v2

    if-eqz v2, :return_null

    invoke-virtual {v1}, Ljava/lang/String;->length()I

    move-result v1

    invoke-virtual {p1, v1}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v1

    const-string v2, "?"

    invoke-virtual {v1, v2}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result v2

    if-ltz v2, :after_query

    const/4 v2, -0x1

    :after_query
    if-gez v2, :query_removed

    invoke-virtual {v1}, Ljava/lang/String;->length()I

    move-result v2

    :query_removed
    const-string v3, "#"

    invoke-virtual {v1, v3}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result v3

    if-ltz v3, :after_fragment

    const/4 v3, -0x1

    :after_fragment
    if-ltz v3, :fragment_checked

    if-ge v3, v2, :fragment_checked

    move v2, v3

    :fragment_checked
    const/4 v3, 0x0

    invoke-virtual {v1, v3, v2}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/String;->isEmpty()Z

    move-result v2

    if-nez v2, :return_null

    const-string v2, ".."

    invoke-virtual {v1, v2}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v2

    if-nez v2, :return_null

    :try_start_0
    iget-object v2, p0, Lcom/dominus/aetherionreforgey/AetherionAssetClient;->assets:Landroid/content/res/AssetManager;

    const/4 v3, 0x2

    invoke-virtual {v2, v1, v3}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;I)Ljava/io/InputStream;

    move-result-object v2

    invoke-static {v1}, Ljava/net/URLConnection;->guessContentTypeFromName(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    const-string v4, ".js"

    invoke-virtual {v1, v4}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :check_glb

    const-string v3, "application/javascript"

    goto :mime_ready

    :check_glb
    const-string v4, ".glb"

    invoke-virtual {v1, v4}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :check_webp

    const-string v3, "model/gltf-binary"

    goto :mime_ready

    :check_webp
    const-string v4, ".webp"

    invoke-virtual {v1, v4}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :check_svg

    const-string v3, "image/webp"

    goto :mime_ready

    :check_svg
    const-string v4, ".svg"

    invoke-virtual {v1, v4}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :check_json

    const-string v3, "image/svg+xml"

    goto :mime_ready

    :check_json
    const-string v4, ".json"

    invoke-virtual {v1, v4}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v1

    if-eqz v1, :mime_fallback

    const-string v3, "application/json"

    goto :mime_ready

    :mime_fallback
    if-nez v3, :mime_ready

    const-string v3, "application/octet-stream"

    :mime_ready
    const/4 v4, 0x0

    const-string v1, "text/"

    invoke-virtual {v3, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v1

    if-nez v1, :text_encoding

    const-string v1, "application/javascript"

    invoke-virtual {v3, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-nez v1, :text_encoding

    const-string v1, "application/json"

    invoke-virtual {v3, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :encoding_ready

    :text_encoding
    const-string v4, "UTF-8"

    :encoding_ready
    new-instance v1, Landroid/webkit/WebResourceResponse;

    invoke-direct {v1, v3, v4, v2}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    return-object v1

    :catch_0
    move-exception v1

    return-object v0

    :return_null
    return-object v0
.end method

.method private openExternal(Landroid/content/Context;Ljava/lang/String;)Z
    .locals 4

    const/4 v0, 0x0

    if-eqz p1, :external_done

    if-eqz p2, :external_done

    const-string v1, "https://appassets.androidplatform.net/assets/"

    invoke-virtual {p2, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v1

    if-nez v1, :external_done

    const-string v1, "https://"

    invoke-virtual {p2, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v1

    if-nez v1, :open_external

    const-string v1, "http://"

    invoke-virtual {p2, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v1

    if-eqz v1, :external_done

    :open_external
    :try_start_0
    new-instance v1, Landroid/content/Intent;

    const-string v2, "android.intent.action.VIEW"

    invoke-static {p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v3

    invoke-direct {v1, v2, v3}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V

    invoke-virtual {p1, v1}, Landroid/content/Context;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    const/4 v0, 0x1

    goto :external_done

    :catch_0
    move-exception v1

    :external_done
    return v0
.end method


# virtual methods
.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .locals 1

    if-eqz p2, :request_missing

    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object v0

    invoke-virtual {v0}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-direct {p0, v0}, Lcom/dominus/aetherionreforgey/AetherionAssetClient;->openAsset(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;

    move-result-object v0

    return-object v0

    :request_missing
    const/4 v0, 0x0

    return-object v0
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebView;Ljava/lang/String;)Landroid/webkit/WebResourceResponse;
    .locals 1

    invoke-direct {p0, p2}, Lcom/dominus/aetherionreforgey/AetherionAssetClient;->openAsset(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;

    move-result-object v0

    return-object v0
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Z
    .locals 2

    if-eqz p1, :modern_missing

    if-eqz p2, :modern_missing

    invoke-virtual {p1}, Landroid/webkit/WebView;->getContext()Landroid/content/Context;

    move-result-object v0

    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object v1

    invoke-virtual {v1}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-direct {p0, v0, v1}, Lcom/dominus/aetherionreforgey/AetherionAssetClient;->openExternal(Landroid/content/Context;Ljava/lang/String;)Z

    move-result v0

    return v0

    :modern_missing
    const/4 v0, 0x0

    return v0
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Ljava/lang/String;)Z
    .locals 1

    if-eqz p1, :legacy_missing

    invoke-virtual {p1}, Landroid/webkit/WebView;->getContext()Landroid/content/Context;

    move-result-object v0

    invoke-direct {p0, v0, p2}, Lcom/dominus/aetherionreforgey/AetherionAssetClient;->openExternal(Landroid/content/Context;Ljava/lang/String;)Z

    move-result v0

    return v0

    :legacy_missing
    const/4 v0, 0x0

    return v0
.end method
