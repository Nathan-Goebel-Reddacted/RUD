import ActionResult from "../services/resultAction"
import { Language, type Language as LanguageType } from "@/enum/language";

class Profile{
    private profileName: string = ""

    private connectionNeeded: boolean = false //not implemented

    //private ConnectionRoute: Route

    private roleForEditDashboard: string = "" //not implemented

    private roleForEditProfile: string = "" //not implemented

    private language: LanguageType = Language.EN

    private backgroundColor: string = "#242424"
    private borderColor: string     = "#888888"
    private textColor: string       = "#646cff"
    private textHoverColor: string  = "#535bf2"

    //private TimeZone

    //private Daboards: Array<Dashboard>
    
    //private APIs: Array<API>

    //colorpick

    //Fontsize
    
    //createdat

    //updatedat


    constructor(){}

    public createAProfile(
        profileName: string,
        isConnectionNeeded: boolean
    ) {
        this.profileName = profileName
        this.connectionNeeded = isConnectionNeeded  
    }



    public IsProfileValid(): ActionResult {
        let actionResult = new ActionResult("")
        if (!this.IsProfileNameValid(this.profileName).isSuccess()){
            actionResult.addReason("Profile.invalid","profile.invalid")
        }
        if (this.language !== Language.EN && this.language !== Language.FR){
            actionResult.addReason("Profile.invalidLanguage","profile.invalidLanguage")
        }
        return actionResult
    }

    private IsProfileNameValid(ProfileName:string ): ActionResult {
        let actionResult = new ActionResult("")
        if(ProfileName.length < 5){
            actionResult.addReason("Profile.name.tooShort","profile.invalidName")
        }
        return actionResult
    } 

    public getProfileName(): string
    {
        return this.profileName
    }

    public isConnectionNeeded(): boolean
    {
        return this.connectionNeeded
    }

    public setProfileName(profileName: string){
        if (this.IsProfileNameValid(profileName).isSuccess()){
            this.profileName = profileName
        }
    }

    public setConnectionNeeded(isConnectionNeeded: boolean){
        this.connectionNeeded = isConnectionNeeded
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
}

export default Profile