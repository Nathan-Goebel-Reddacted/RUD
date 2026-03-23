class ActionResult{
    private reasons: Array<Reason> = []

    private successMessage: string = ""

    public constructor(
        successMessage: string,
    ){
        this.successMessage = successMessage
    }

    public addReason(errorCode: string, errorMessage: string){
        this.reasons.push(new Reason(errorCode, errorMessage))
    }

    public isSuccess(): boolean{
        return this.reasons.length === 0
    }

    public getSuccessMessage(): string{
        return this.successMessage
    }

    public getFormattedReasons(): string {
        return this.reasons
            .map(reason => `[${reason.getReasonCode()}] ${reason.getReasonMessage()}`)
            .join('\n')
    }

    public getAllReason(): Array<Reason>{
        return this.reasons
    }

    public getReasonByCode(reasonCode: string): Reason | undefined {
        return this.reasons.find(r => r.getReasonCode() === reasonCode)
    }
}

class Reason{
    private reasonCode: string = ""
    private reasonMessage: string = ""

    public constructor(
        errorCode: string, 
        errorMessage: string
    ) {
        this.reasonCode = errorCode
        this.reasonMessage = errorMessage
    }

    public getReasonCode(): string{
        return this.reasonCode
    }
    public getReasonMessage(): string{
        return this.reasonMessage
    }
}

export default ActionResult 
