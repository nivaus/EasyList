package io.EasyList;  //REPLACE THIS WITH YOUR package name

import android.app.Application;
import org.apache.cordova.*;
import com.parse.Parse;
import com.parse.ParseAnalytics;
import com.parse.ParseInstallation;
import com.parse.PushService;
import com.parse.ParsePush;
import com.parse.ParseCrashReporting;

public class MainApplication extends Application {
    private static final String CLIENT_KEY="wV1lOSJJWBlvQhvQYISlKyGlFiolEaXMsbOaMD7I";
    private static final String APP_ID="YNiKFOkpulbY1j19E2gcdSREgTKd0AiZZKtzJaeg";

    @Override
    public void onCreate() {
        super.onCreate();
        ParseCrashReporting.enable(getApplicationContext());
        Parse.initialize(this, APP_ID, CLIENT_KEY);
        PushService.setDefaultPushCallback(this, MainActivity.class);
//        ParsePush.subscribeInBackground("Broadcast");
//        ParseInstallation.getCurrentInstallation().saveInBackground();
    }
}