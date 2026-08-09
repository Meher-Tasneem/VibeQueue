"""#traversing
a=[10,20,30,40]
for i in a:
    print(i,end=" ")

#duplicates in array
arr=[1,2,3,2,4,5,1]
duplicates=[]
for i in range(len(arr)):
    for j in range(i+1,len(arr)):
        if arr[i]==arr[j] and arr[i]not in duplicates:
            duplicates.append(arr[i])
print("duplicates=",duplicates,end=" ")"""
"""#2nd largest in array
arr=[1,2,3,4,5]
largest=max(arr)
print("largest=",largest)
arr.remove(largest)
second_largest=max(arr)
print("second largest=",second_largest)"""

"""#alternate
arr=[1,2,3,4]
largest=max(arr)
smallest=min(arr)
print("largest=",largest)
print("smallest=",smallest)

arr=[1,2,3,4]
max=arr[0]
min=arr[0]
for i in range(len(arr)):
    if arr[i]<min:
        min=arr[i]
    elif arr[i]>max:
        max=arr[i]
print("max=",max)
print("min =",min)"""
"""#count even or odd
arr=[1,2,3,4]
even=0
odd=0
for i in range(len(arr)):
    if arr[i]%2==0:
        even+=1
    else:
        odd+=1
print("even count=",even)
print("odd count=",odd)"""
"""#reverse array
a=[1,2,3,4]
start=0
end=len(a)-1
print("array:",a)
print("reverse using slicing:",a[::-1])
while start<end:
    a[start],a[end]=a[end],a[start]
    start+=1
    end-=1
print("reverse array:",a)"""
"""#linear search
a=[20,40,60,40,30]
print("array=",a)
key=60
for i in range(len(a)):
    if a[i]==key:
        print("key found=",a[i])
        break
else:
    print("key not found")"""

#binary search
a=[10,20,30,40,50]
key=100
low=0
high=len(a)-1
while low<=high:
    mid=(low+high)//2
    if a[mid]==key:
        print("key found:",key)
        break
    elif key<a[mid]:
        high=mid-1
    else:
        low=mid+1
else:
    print("key not found")
    
