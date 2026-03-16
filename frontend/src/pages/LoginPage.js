import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { BookOpen, Mail, Lock, User } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const user = await login(formData.email, formData.password);
        toast.success(`Welcome back, ${user.name}!`);
        navigate(user.role === "admin" ? "/admin" : "/dashboard");
      } else {
        const user = await register(formData.email, formData.password, formData.name);
        toast.success(`Account created! Welcome, ${user.name}!`);
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pacific-50 via-white to-genius-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pacific-500 text-white mb-4 shadow-lg">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">EduQuest</h1>
          <p className="text-slate-600 mt-1">Your learning adventure begins here</p>
        </div>

        <Card className="shadow-xl border-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-heading text-xl">
              {isLogin ? "Welcome Back!" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Sign in to continue your learning journey" 
                : "Join thousands of students learning with EduQuest"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      id="name"
                      data-testid="register-name-input"
                      type="text"
                      placeholder="Enter your name"
                      className="pl-10 h-11"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 h-11"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <button 
                    type="button"
                    className="text-sm text-pacific-500 hover:text-pacific-600 font-medium"
                    onClick={() => toast.info("Password reset feature coming soon!")}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button 
                type="submit" 
                data-testid="login-submit-btn"
                className="w-full h-11 bg-pacific-500 hover:bg-pacific-600 text-white font-semibold rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  isLogin ? "Sign In" : "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  data-testid="toggle-auth-mode-btn"
                  className="text-pacific-500 hover:text-pacific-600 font-semibold"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>

            {/* Demo credentials hint */}
            <div className="mt-4 p-3 bg-genius-50 rounded-lg border border-genius-200">
              <p className="text-xs text-genius-800 font-medium text-center">
                Demo Admin: admin@eduquest.com / admin123
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Decorative image */}
        <div className="mt-8 text-center">
          <img 
            src="https://images.unsplash.com/photo-1557734864-c78b6dfef1b1?w=400&h=200&fit=crop" 
            alt="Students learning"
            className="w-64 h-32 mx-auto rounded-xl object-cover shadow-lg opacity-80"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
