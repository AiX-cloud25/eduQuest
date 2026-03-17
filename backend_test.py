#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class EduQuestAPITester:
    def __init__(self, base_url="https://textbook-reader.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.admin_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name}: {'PASS' if success else 'FAIL'}")
        if details and not success:
            print(f"   Details: {details}")

    def test_api_endpoint(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Generic API test method"""
        url = f"{self.api_base}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True, f"Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except requests.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.test_api_endpoint(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_admin_login(self):
        """Test admin login and store token"""
        success, response = self.test_api_endpoint(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            {"email": "admin@eduquest.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_test("Admin Token Retrieved", True)
        else:
            self.log_test("Admin Token Retrieved", False, "No access token in response")
            
        return success

    def test_curriculum_endpoints(self):
        """Test curriculum data endpoints"""
        # Test classes endpoint
        self.test_api_endpoint(
            "Get Classes List",
            "GET",
            "curriculum/classes",
            200
        )
        
        # Test subjects endpoint
        self.test_api_endpoint(
            "Get Class 9 Subjects",
            "GET",
            "curriculum/subjects/9",
            200
        )
        
        # Test topics endpoint - Science
        self.test_api_endpoint(
            "Get Science Topics",
            "GET",
            "curriculum/topics/9/science",
            200
        )
        
        # Test chapters endpoint - Biology
        self.test_api_endpoint(
            "Get Biology Chapters",
            "GET",
            "curriculum/chapters/9/science/biology",
            200
        )

    def test_chapter_content(self):
        """Test Chapter 14 content endpoint"""
        if not self.admin_token:
            self.log_test("Chapter 14 Content", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        success, response = self.test_api_endpoint(
            "Chapter 14 Biology Content",
            "GET",
            "chapters/9/science/biology/14",
            200,
            headers=headers
        )
        
        if success:
            # Validate chapter structure
            if 'sections' in response and len(response['sections']) > 0:
                self.log_test("Chapter 14 Has Sections", True, f"Found {len(response['sections'])} sections")
            else:
                self.log_test("Chapter 14 Has Sections", False, "No sections found")

    def test_media_endpoints(self):
        """Test media management endpoints"""
        if not self.admin_token:
            self.log_test("Media Endpoints", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test get all media
        success, media_response = self.test_api_endpoint(
            "Get All Media",
            "GET",
            "media",
            200,
            headers=headers
        )
        
        # Test get GIFs only
        success, gif_response = self.test_api_endpoint(
            "Get GIF Media",
            "GET",
            "media?type=gif",
            200,
            headers=headers
        )
        
        if success and isinstance(gif_response, list):
            gif_count = len(gif_response)
            self.log_test("Chapter 14 GIFs Seeded", gif_count >= 8, f"Found {gif_count} GIFs (expected ≥8)")

    def test_explainer_endpoint(self):
        """Test explainer media endpoint"""
        if not self.admin_token:
            self.log_test("Explainer Endpoint", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test explainer for a specific topic
        path = "class9/science/biology/chapter14/need-for-respiration"
        success, response = self.test_api_endpoint(
            "Get Explainer Media",
            "GET",
            f"explainers/{path}",
            200,
            headers=headers
        )

    def test_auth_protection(self):
        """Test endpoints require authentication"""
        # Test protected endpoint without token
        self.test_api_endpoint(
            "Protected Endpoint (No Token)",
            "GET",
            "media",
            401  # Should be unauthorized
        )
        
        # Test with invalid token
        headers = {"Authorization": "Bearer invalid_token"}
        self.test_api_endpoint(
            "Protected Endpoint (Invalid Token)",
            "GET",
            "media",
            401,
            headers=headers
        )

    def test_qa_endpoints(self):
        """Test Q&A functionality"""
        if not self.admin_token:
            self.log_test("Q&A Tests", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test get chapter questions
        success, response = self.test_api_endpoint(
            "Get Chapter 14 Questions",
            "GET",
            "chapters/9/science/biology/14/questions",
            200,
            headers=headers
        )
        
        if success:
            # Check if questions have the expected structure
            if 'sections' in response and 'mcq' in response['sections']:
                self.log_test("Chapter 14 Has MCQ Questions", True, f"MCQ section found")
            else:
                self.log_test("Chapter 14 Has MCQ Questions", False, "No MCQ section found")
        
        # Test submit answers
        test_submission = {
            "chapterId": "class9/science/biology/chapter14",
            "answers": [
                {
                    "questionId": "mcq-1",
                    "type": "mcq",
                    "selectedOption": "contracts",
                    "answerText": None
                },
                {
                    "questionId": "vs-1",
                    "type": "veryShort",
                    "selectedOption": None,
                    "answerText": "Diaphragm"
                }
            ]
        }
        
        success, response = self.test_api_endpoint(
            "Submit Q&A Answers",
            "POST",
            "qa/submit",
            200,
            data=test_submission,
            headers=headers
        )

    def test_admin_only_endpoints(self):
        """Test admin-only functionality"""
        if not self.admin_token:
            self.log_test("Admin Only Tests", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Try to create media (admin only)
        media_data = {
            "title": "Test GIF",
            "filePath": "test.gif",
            "sourceType": "local",
            "linkedTo": "test/path",
            "type": "gif"
        }
        
        success, response = self.test_api_endpoint(
            "Create Media (Admin Only)",
            "POST",
            "media",
            200,
            data=media_data,
            headers=headers
        )
        
        # Clean up - delete the test media if created
        if success and 'id' in response:
            media_id = response['id']
            self.test_api_endpoint(
                "Delete Test Media",
                "DELETE",
                f"media/{media_id}",
                200,
                headers=headers
            )

    def run_all_tests(self):
        """Run complete test suite"""
        print("🧪 Starting EduQuest API Testing...")
        print("=" * 50)
        
        # Basic connectivity
        self.test_root_endpoint()
        
        # Authentication
        self.test_admin_login()
        
        # Auth protection
        self.test_auth_protection()
        
        # Curriculum data
        self.test_curriculum_endpoints()
        
        # Chapter content
        self.test_chapter_content()
        
        # Media management
        self.test_media_endpoints()
        
        # Explainer endpoints
        self.test_explainer_endpoint()
        
        # Q&A functionality
        self.test_qa_endpoints()
        
        # Admin functionality
        self.test_admin_only_endpoints()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed - check details above")
            print("\n📝 Failed Tests Summary:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"   ❌ {result['test']}: {result['details']}")
            return 1

def main():
    tester = EduQuestAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())