# Tasks: Add Auth Login and Register UI

## 1. OpenSpec and scope

- [x] 1.1 Confirm scope from proposal (split-screen Login/Register, music-inspired, no social login, light theme supported)

## 2. Auth components

- [x] 2.1 Create AnimatedBackground (waveform / equalizer / gradient)
- [x] 2.2 Create AuthCard wrapper
- [x] 2.3 Create AuthInput (AuthInput.tsx)
- [x] 2.4 Create PasswordInput with visibility toggle and strength indicator
- [x] 2.5 Create AuthButton with loading state
- [x] 2.6 Create Divider and FormError / FormSuccess
- [x] 2.7 Create shared auth styles (auth.css or Tailwind + keyframes)

## 3. Pages and layout

- [x] 3.1 Create AuthLayout (split left/right, responsive)
- [x] 3.2 Create Login page (form + link to register)
- [x] 3.3 Create Register page (form + confirm password + strength + link to login)
- [x] 3.4 Add /login and /register routes; AuthGuard redirect to /login when unauthenticated

## 4. Polish and integration

- [x] 4.1 Wire Login/Register forms to AuthContext (signIn, signUp)
- [x] 4.2 Add theme toggle on auth layout
- [x] 4.3 Inline validation and accessible labels
- [x] 4.4 Animations (Framer Motion): background, focus, loading, transitions
