import ActionResult from "../services/resultAction"
import { Language, type Language as LanguageType } from "@/enum/language";

export type DisplayMode = "timer" | "scroll-end" | "disabled";

class Profile{
    private profileName: string = ""

    private language: LanguageType = Language.EN

    private backgroundColor: string = "#242424"
    private borderColor: string     = "#888888"
    private textColor: string       = "#646cff"
    private textHoverColor: string  = "#535bf2"

    private displayMode:     DisplayMode = "timer";
    private displayInterval: number      = 30;
    private scrollSpeed:     number      = 0;
    private loopPauseMs:     number      = 2000;

    private variables: Record<string, string> = {};

    constructor(){}

    public createAProfile(profileName: string) {
        this.profileName = profileName
    }

    public isProfileValid(): ActionResult {
        const actionResult = new ActionResult("")
        if (!this.isProfileNameValid(this.profileName).isSuccess()){
            actionResult.addReason("Profile.invalid","profile.invalid")
        }
        if (this.language !== Language.EN && this.language !== Language.FR){
            actionResult.addReason("Profile.invalidLanguage","profile.invalidLanguage")
        }
        return actionResult
    }

    private isProfileNameValid(ProfileName:string ): ActionResult {
        const actionResult = new ActionResult("")
        if(ProfileName.length < 5){
            actionResult.addReason("Profile.name.tooShort","profile.invalidName")
        }
        return actionResult
    }

    public getProfileName(): string {
        return this.profileName
    }

    public setProfileName(profileName: string){
        if (this.isProfileNameValid(profileName).isSuccess()){
            this.profileName = profileName
        }
    }

    public setLanguage(language: LanguageType){
        this.language = language
    }

    public getLanguage(): LanguageType{
        return this.language
    }

    private isHexColorValid(color: string): boolean {
        return /^#[0-9a-fA-F]{6}$/.test(color)
    }

    public getBackgroundColor(): string { return this.backgroundColor }
    public getBorderColor(): string     { return this.borderColor }
    public getTextColor(): string       { return this.textColor }
    public getTextHoverColor(): string  { return this.textHoverColor }

    public setBackgroundColor(color: string): void {
        if (this.isHexColorValid(color)) this.backgroundColor = color
    }
    public setBorderColor(color: string): void {
        if (this.isHexColorValid(color)) this.borderColor = color
    }
    public setTextColor(color: string): void {
        if (this.isHexColorValid(color)) this.textColor = color
    }
    public setTextHoverColor(color: string): void {
        if (this.isHexColorValid(color)) this.textHoverColor = color
    }

    public getDisplayMode():     DisplayMode { return this.displayMode; }
    public getDisplayInterval(): number      { return this.displayInterval; }
    public getScrollSpeed():     number      { return this.scrollSpeed; }
    public getLoopPauseMs():     number      { return this.loopPauseMs; }

    public setDisplayMode(m: DisplayMode): void { this.displayMode = m; }
    public setDisplayInterval(s: number):  void { this.displayInterval = s; }
    public setScrollSpeed(px: number):     void { this.scrollSpeed = px; }
    public setLoopPauseMs(ms: number):     void { this.loopPauseMs = ms; }

    public getVariables(): Record<string, string> { return { ...this.variables }; }
    public setVariables(vars: Record<string, string>): void { this.variables = { ...vars }; }

    public toJSON(): object {
        return {
            profileName:     this.profileName,
            language:        this.language,
            backgroundColor: this.backgroundColor,
            borderColor:     this.borderColor,
            textColor:       this.textColor,
            textHoverColor:  this.textHoverColor,
            displayMode:     this.displayMode,
            displayInterval: this.displayInterval,
            scrollSpeed:     this.scrollSpeed,
            loopPauseMs:     this.loopPauseMs,
            variables:       this.variables,
        }
    }

    public static fromJSON(data: unknown): Profile | null {
        try {
            if (!data || typeof data !== "object") return null
            const d = data as Record<string, unknown>
            const p = new Profile()
            p.createAProfile(typeof d.profileName === "string" ? d.profileName : "")
            if (typeof d.language === "string" && Object.values(Language).includes(d.language as LanguageType)) p.setLanguage(d.language as LanguageType)
            if (typeof d.backgroundColor === "string") p.setBackgroundColor(d.backgroundColor)
            if (typeof d.borderColor === "string") p.setBorderColor(d.borderColor)
            if (typeof d.textColor === "string") p.setTextColor(d.textColor)
            if (typeof d.textHoverColor === "string") p.setTextHoverColor(d.textHoverColor)
            if (d.displayMode === "timer" || d.displayMode === "scroll-end" || d.displayMode === "disabled") {
                p.setDisplayMode(d.displayMode)
            }
            if (typeof d.displayInterval === "number") p.setDisplayInterval(d.displayInterval)
            if (typeof d.scrollSpeed === "number") p.setScrollSpeed(d.scrollSpeed)
            if (typeof d.loopPauseMs === "number") p.setLoopPauseMs(d.loopPauseMs)
            if (d.variables && typeof d.variables === "object" && !Array.isArray(d.variables)) {
                const vars: Record<string, string> = {};
                for (const [k, v] of Object.entries(d.variables as Record<string, unknown>)) {
                    if (typeof v === "string") vars[k] = v;
                }
                p.setVariables(vars);
            }
            if (!p.isProfileValid().isSuccess()) return null
            return p
        } catch {
            return null
        }
    }
}

export default Profile
