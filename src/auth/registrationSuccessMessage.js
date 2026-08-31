export const getRegistrationSuccessMessage = (result, language = "en") => {
  const isPending = result?.status === "pending";
  const needsEmailVerification =
    Boolean(result?.requiresEmailVerification) && result?.emailVerified === false;
  const verificationEmailSent = Boolean(result?.verificationEmailSent);

  if (language === "en") {
    if (needsEmailVerification && verificationEmailSent && isPending) {
      return "Registration successful. Please check your email and verify it. Your account is pending admin review.";
    }

    if (needsEmailVerification && isPending) {
      return "Registration successful. Your account is pending admin review. Please verify your email before signing in.";
    }

    if (isPending) {
      return "Registration successful. Your account is pending admin review.";
    }

    if (needsEmailVerification && verificationEmailSent) {
      return "Registration successful. Please check your email and verify it before signing in.";
    }

    if (needsEmailVerification) {
      return "Registration successful. Please verify your email before signing in.";
    }

    return "Registration successful.";
  }

  if (needsEmailVerification && verificationEmailSent && isPending) {
    return "تم التسجيل بنجاح. يرجى مراجعة بريدك الإلكتروني والضغط على رابط التفعيل. حسابك قيد مراجعة الإدارة.";
  }

  if (needsEmailVerification && isPending) {
    return "تم التسجيل بنجاح. حسابك قيد مراجعة الإدارة. يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.";
  }

  if (isPending) {
    return "تم التسجيل بنجاح. حسابك قيد مراجعة الإدارة.";
  }

  if (needsEmailVerification && verificationEmailSent) {
    return "تم التسجيل بنجاح. يرجى مراجعة بريدك الإلكتروني والضغط على رابط التفعيل قبل تسجيل الدخول.";
  }

  if (needsEmailVerification) {
    return "تم التسجيل بنجاح. يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.";
  }

  return "تم التسجيل بنجاح.";
};
