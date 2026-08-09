class subject:
    def __init__(self,name,marks):
        self.name=name
        self.marks=marks
class student:
    def __init__(self,student_id,student_name):
        self.student_id=student_id
        self.student_name=student_name
        self.subjects=[]
    def add_subject(self,subject):
        self.subjects.append(subject)

        
        
