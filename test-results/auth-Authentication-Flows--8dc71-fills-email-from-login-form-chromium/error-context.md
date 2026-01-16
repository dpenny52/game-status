# Page snapshot

```yaml
- generic [ref=e3]:
  - dialog "Reset Password" [ref=e4]:
    - generic [ref=e5]:
      - heading "Reset Password" [level=2] [ref=e6]
      - button "Close modal" [active] [ref=e7] [cursor=pointer]:
        - img [ref=e8]
    - generic [ref=e12]:
      - paragraph [ref=e13]: Enter your email address and we will send you a link to reset your password.
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Email
          - textbox "Email" [ref=e17]:
            - /placeholder: you@example.com
        - button "Send Reset Link" [ref=e18] [cursor=pointer]
      - button "Back to login" [ref=e19] [cursor=pointer]
  - generic [ref=e22]:
    - heading "Sign in Required" [level=2] [ref=e23]
    - paragraph [ref=e24]: Please sign in to access your account settings.
    - button "Sign In" [ref=e25] [cursor=pointer]
```