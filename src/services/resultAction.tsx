class ActionResult{
    private reasons: Array<Reason> = []

    private successMessage: string = ""

    public constructor(
        successMessage: string,
    ){
        this.successMessage = successMessage
    }

    public addReason(ErrorCode:string,ErrorMessage:string){
        this.reasons.push(new Reason(ErrorCode, ErrorMessage))
    }

    public isSuccess(): boolean{
        return this.reasons.length === 0
    }

    public getsuccessMessage(): string{
        return this.successMessage
    }

    public getFormattedreasons(): string {
        return this.reasons
            .map(reason => `[${reason.getreasonCode}] ${reason.getreasonMessage()}`)
            .join('\n')
    }

    public getAllReason(): Array<Reason>{
        return this.reasons
    }

    public getReasonByCode(reasonCode: string): Reason | undefined {
        return this.reasons.find(r => r.getreasonCode() === reasonCode)
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

    public getreasonCode(): string{
        return this.reasonCode
    }
    public getreasonMessage(): string{
        return this.reasonMessage
    }
}

export default ActionResult 
