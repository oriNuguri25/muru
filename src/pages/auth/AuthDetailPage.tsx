import { ArrowRight, Building, GraduationCap, User } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabase/SupabaseClient";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

const AuthDetailPage = () => {
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"center" | "school" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error("사용자 정보가 없습니다.");
      return;
    }

    if (!name.trim() || !userType) {
      console.error("모든 필드를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("user_profile").upsert({
        user_id: user.id,
        name: name.trim(),
        email: user.email,
        type: userType,
      });

      if (error) {
        console.error("프로필 저장 중 오류:", error);
        alert("프로필 저장에 실패했습니다. 다시 시도해주세요.");
      } else {
        console.log("프로필이 성공적으로 저장되었습니다.");
        // 메인 페이지로 이동
        navigate("/");
      }
    } catch (error) {
      console.error("프로필 저장 중 예외 발생:", error);
      alert("프로필 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              회원가입 완료!
            </h1>
            <div className="text-gray-600">
              서비스 이용을 위해 추가 정보를 입력해주세요.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                이름
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력해주세요"
                className="w-full p-4 border text-black border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-colors"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                소속을 선택해주세요
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setUserType("center")}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    userType === "center"
                      ? "border-purple-400 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-purple-200 hover:bg-purple-25"
                  }`}
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        userType === "center" ? "bg-purple-400" : "bg-gray-200"
                      }`}
                    >
                      <Building
                        className={`w-5 h-5 ${
                          userType === "center" ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-black">센터 직원</div>
                      <div className="text-sm text-gray-600">
                        학습센터, 교육기관 등
                      </div>
                    </div>
                  </div>
                </button>

                {/* School Staff Option */}
                <button
                  type="button"
                  onClick={() => setUserType("school")}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    userType === "school"
                      ? "border-purple-400 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-purple-200 hover:bg-purple-25"
                  }`}
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        userType === "school" ? "bg-purple-400" : "bg-gray-200"
                      }`}
                    >
                      <GraduationCap
                        className={`w-5 h-5 ${
                          userType === "school" ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-black">학교 직원</div>
                      <div className="text-sm text-gray-600">
                        초등학교, 중학교, 고등학교 등
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!name.trim() || !userType || isLoading}
              className="w-full bg-purple-400 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <span>시작하기</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              입력하신 정보는 맞춤형 학습 자료 제공을 위해 사용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDetailPage;
