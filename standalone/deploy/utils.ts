interface PayloadResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

class SmartPayloadBuilder {
  static success(message: string, data: any = null): PayloadResult {
    return {
      success: true,
      message,
      data
    };
  }

  static error(message: string, error: any = null): PayloadResult {
    return {
      success: false,
      message,
      error
    };
  }
}

export default SmartPayloadBuilder;
